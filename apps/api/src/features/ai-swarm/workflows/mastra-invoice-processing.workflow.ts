import { createStep, createWorkflow, type Step } from "@mastra/core/workflows";
import { z } from "zod";
import { SUNATAgent } from "../agents/sunat.agent";

const ITEM_SCHEMA = z.object({
	descripcion: z.string().min(1),
	cantidad: z.number().positive(),
	precioUnitario: z.number().nonnegative(),
	subtotal: z.number().nonnegative(),
});

const WORKFLOW_INPUT_SCHEMA = z.object({
	documentId: z.string().min(1),
	filename: z.string().min(1),
	mimeType: z.string().min(1).optional(),
	ruc: z.string().optional(),
	serie: z.string().optional(),
	numero: z.string().optional(),
	fecha: z.string().optional(),
	moneda: z.enum(["PEN", "USD", "EUR"]).optional(),
	subtotal: z.number().positive().optional(),
	igv: z.number().nonnegative().optional(),
	total: z.number().positive().optional(),
	items: z.array(ITEM_SCHEMA).optional(),
});

const READER_OUTPUT_SCHEMA = z.object({
	id: z.string(),
	ruc: z.string(),
	serie: z.string(),
	numero: z.string(),
	fecha: z.string(),
	moneda: z.enum(["PEN", "USD", "EUR"]),
	subtotal: z.number(),
	igv: z.number(),
	total: z.number(),
	items: z.array(ITEM_SCHEMA),
	extractionConfidence: z.number().min(0).max(1),
});

const VALIDATION_SCHEMA = z.object({
	isValid: z.boolean(),
	errors: z.array(
		z.object({
			field: z.string(),
			code: z.string(),
			message: z.string(),
			severity: z.enum(["error", "critical"]),
		}),
	),
	warnings: z.array(
		z.object({
			field: z.string(),
			code: z.string(),
			message: z.string(),
			suggestion: z.string().optional(),
		}),
	),
	confidence: z.number().min(0).max(1),
});

const VALIDATOR_OUTPUT_SCHEMA = z.object({
	invoiceData: READER_OUTPUT_SCHEMA,
	validation: VALIDATION_SCHEMA,
	metadata: z.object({
		modelUsed: z.string(),
		tokensUsed: z.number(),
		costUsd: z.number(),
		durationMs: z.number(),
	}),
});

const ARBITER_OUTPUT_SCHEMA = z.object({
	documentId: z.string(),
	decision: z.enum(["approved", "manual_review", "rejected"]),
	reason: z.string(),
	confidence: z.number().min(0).max(1),
	invoiceData: READER_OUTPUT_SCHEMA,
	validation: VALIDATION_SCHEMA,
});

/**
 * MastraInvoiceWorkflowInput type.
 *
 * @example
 * ```ts
 * const value: MastraInvoiceWorkflowInput = {} as MastraInvoiceWorkflowInput;
 * console.log(value);
 * ```
 */
export type MastraInvoiceWorkflowInput = z.infer<typeof WORKFLOW_INPUT_SCHEMA>;
/**
 * MastraInvoiceWorkflowOutput type.
 *
 * @example
 * ```ts
 * const value: MastraInvoiceWorkflowOutput = {} as MastraInvoiceWorkflowOutput;
 * console.log(value);
 * ```
 */
export type MastraInvoiceWorkflowOutput = z.infer<typeof ARBITER_OUTPUT_SCHEMA>;

/**
 * InvoiceWorkflowAgentId type.
 *
 * @example
 * ```ts
 * const value: InvoiceWorkflowAgentId = {} as InvoiceWorkflowAgentId;
 * console.log(value);
 * ```
 */
export type InvoiceWorkflowAgentId = "lector" | "validador" | "arbitro";

const STEP_TO_AGENT: Record<string, InvoiceWorkflowAgentId> = {
	"reader-agent": "lector",
	"validator-agent": "validador",
	"arbiter-agent": "arbitro",
};

const sunatAgent = new SUNATAgent();

function buildInvoiceSeriesNumber(
	serie?: string,
	numero?: string,
): { serie: string; numero: string } {
	const normalizedSerie = (serie ?? "F001").toUpperCase();
	const numeric = Number.parseInt(numero ?? "1", 10);
	const normalizedNumero =
		Number.isFinite(numeric) && numeric > 0
			? numeric.toString().padStart(8, "0")
			: "00000001";

	return { serie: normalizedSerie, numero: normalizedNumero };
}

function computeTotals(input: MastraInvoiceWorkflowInput): {
	subtotal: number;
	igv: number;
	total: number;
} {
	const subtotal = input.subtotal ?? 100;
	const igv = input.igv ?? Number((subtotal * 0.18).toFixed(2));
	const total = input.total ?? Number((subtotal + igv).toFixed(2));
	return { subtotal, igv, total };
}

const readerStep = createStep({
	id: "reader-agent",
	description: "Lector: normaliza datos iniciales de la factura entrante.",
	inputSchema: WORKFLOW_INPUT_SCHEMA,
	outputSchema: READER_OUTPUT_SCHEMA,
	execute: async ({ inputData }) => {
		const { serie, numero } = buildInvoiceSeriesNumber(
			inputData.serie,
			inputData.numero,
		);
		const totals = computeTotals(inputData);

		return {
			id: inputData.documentId,
			ruc: inputData.ruc ?? "20553510661",
			serie,
			numero,
			fecha: inputData.fecha ?? new Date().toISOString().slice(0, 10),
			moneda: inputData.moneda ?? "PEN",
			subtotal: totals.subtotal,
			igv: totals.igv,
			total: totals.total,
			items: inputData.items ?? [
				{
					descripcion: `Documento ${inputData.filename}`,
					cantidad: 1,
					precioUnitario: totals.subtotal,
					subtotal: totals.subtotal,
				},
			],
			extractionConfidence: 0.98,
		};
	},
});

const validatorStep = createStep({
	id: "validator-agent",
	description:
		"Validador: ejecuta reglas SUNAT (híbridas) sobre la factura normalizada.",
	inputSchema: READER_OUTPUT_SCHEMA,
	outputSchema: VALIDATOR_OUTPUT_SCHEMA,
	execute: async ({ inputData }) => {
		const validationResult = await sunatAgent.validateInvoice(inputData);

		if (!validationResult.success || !validationResult.data) {
			return {
				invoiceData: inputData,
				validation: {
					isValid: false,
					errors: [
						{
							field: "workflow",
							code: validationResult.error?.code ?? "VALIDATION_FAILED",
							message:
								validationResult.error?.message ??
								"No se pudo validar la factura.",
							severity: "critical" as const,
						},
					],
					warnings: [],
					confidence: 0,
				},
				metadata: {
					modelUsed: validationResult.metadata.modelUsed,
					tokensUsed: validationResult.metadata.tokensUsed,
					costUsd: validationResult.metadata.costUsd,
					durationMs: validationResult.metadata.durationMs,
				},
			};
		}

		return {
			invoiceData: inputData,
			validation: validationResult.data,
			metadata: {
				modelUsed: validationResult.metadata.modelUsed,
				tokensUsed: validationResult.metadata.tokensUsed,
				costUsd: validationResult.metadata.costUsd,
				durationMs: validationResult.metadata.durationMs,
			},
		};
	},
});

const arbiterStep = createStep({
	id: "arbiter-agent",
	description: "Árbitro: decide aprobación automática o revisión manual.",
	inputSchema: VALIDATOR_OUTPUT_SCHEMA,
	outputSchema: ARBITER_OUTPUT_SCHEMA,
	execute: async ({ inputData }) => {
		const criticalErrors = inputData.validation.errors.filter(
			(error) => error.severity === "critical",
		);
		const regularErrors = inputData.validation.errors.length;
		const warningCount = inputData.validation.warnings.length;

		if (criticalErrors.length > 0) {
			return {
				documentId: inputData.invoiceData.id,
				decision: "rejected" as const,
				reason: "Se detectaron errores críticos de cumplimiento SUNAT.",
				confidence: 0.99,
				invoiceData: inputData.invoiceData,
				validation: inputData.validation,
			};
		}

		if (regularErrors > 0 || warningCount >= 2) {
			return {
				documentId: inputData.invoiceData.id,
				decision: "manual_review" as const,
				reason:
					"La factura requiere intervención humana para confirmar consistencia.",
				confidence: 0.8,
				invoiceData: inputData.invoiceData,
				validation: inputData.validation,
			};
		}

		return {
			documentId: inputData.invoiceData.id,
			decision: "approved" as const,
			reason: "Factura validada y aprobada automáticamente.",
			confidence: Math.max(0.7, inputData.validation.confidence),
			invoiceData: inputData.invoiceData,
			validation: inputData.validation,
		};
	},
}) as unknown as Step<
	"arbiter-agent",
	unknown,
	z.infer<typeof VALIDATOR_OUTPUT_SCHEMA>,
	z.infer<typeof ARBITER_OUTPUT_SCHEMA>
>;

/**
 * mastraInvoiceProcessingWorkflow const.
 *
 * @example
 * ```ts
 * console.log(mastraInvoiceProcessingWorkflow);
 * ```
 */
export const mastraInvoiceProcessingWorkflow = createWorkflow({
	id: "invoice-processing-mastra-v1",
	description: "Flujo Mastra para facturas: Lector -> Validador -> Arbitro.",
	inputSchema: WORKFLOW_INPUT_SCHEMA,
	outputSchema: ARBITER_OUTPUT_SCHEMA,
})
	.then(readerStep)
	.then(validatorStep)
	.then(arbiterStep)
	.commit();

/**
 * mapWorkflowStepToAgent operation.
 *
 * @param stepId - Input for stepId.
 * @returns Result of mapWorkflowStepToAgent.
 * @example
 * ```ts
 * const result = mapWorkflowStepToAgent("");
 * console.log(result);
 * ```
 */
export function mapWorkflowStepToAgent(
	stepId: string,
): InvoiceWorkflowAgentId | null {
	return STEP_TO_AGENT[stepId] ?? null;
}

/**
 * DEFAULT_MASTRA_INVOICE_INPUT const.
 *
 * @example
 * ```ts
 * console.log(DEFAULT_MASTRA_INVOICE_INPUT);
 * ```
 */
export const DEFAULT_MASTRA_INVOICE_INPUT: MastraInvoiceWorkflowInput = {
	documentId: "DOC-STREAM-001",
	filename: "factura-demo.pdf",
	mimeType: "application/pdf",
	ruc: "20553510661",
	serie: "F001",
	numero: "1",
	fecha: new Date().toISOString().slice(0, 10),
	moneda: "PEN",
	subtotal: 100,
	igv: 18,
	total: 118,
};
