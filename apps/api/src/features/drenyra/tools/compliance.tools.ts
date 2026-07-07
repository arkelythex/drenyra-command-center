/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */
import { Money, TaxCalculator } from "@drenyra/domain";
import type { AgentContext, AgentTool } from "@drenyra/pi";
import { z } from "zod";

/**
 * calculateIgvTool const.
 *
 * @example
 * ```ts
 * console.log(calculateIgvTool);
 * ```
 */
export const calculateIgvTool: AgentTool = {
	name: "calculate_igv",
	description:
		"Calcula el IGV (18%) para un monto dado. Retorna base imponible, IGV y total.",
	inputSchema: z.object({
		amountCents: z.number().int().min(0),
		currency: z.literal("PEN").default("PEN"),
	}),
	outputSchema: z.object({
		base: z.string(),
		igv: z.string(),
		total: z.string(),
		baseCents: z.number().int(),
		igvCents: z.number().int(),
		totalCents: z.number().int(),
		currency: z.literal("PEN"),
		taxRateBasisPoints: z.literal(1800),
	}),
	approvalLevel: "auto",
	async execute(input: unknown, _context: AgentContext) {
		const inp = input as { amountCents: number; currency?: "PEN" };
		const base = Money.fromCents(inp.amountCents, inp.currency ?? "PEN");
		const result = TaxCalculator.calculateIGV(base);
		return {
			base: result.baseAmount.toString(),
			igv: result.taxAmount.toString(),
			total: result.totalAmount.toString(),
			baseCents: result.baseAmount.getCents(),
			igvCents: result.taxAmount.getCents(),
			totalCents: result.totalAmount.getCents(),
			currency: "PEN" as const,
			taxRateBasisPoints: 1800 as const,
		};
	},
};

/**
 * submitSireTool const.
 *
 * @example
 * ```ts
 * console.log(submitSireTool);
 * ```
 */
export const submitSireTool: AgentTool = {
	name: "submit_sire",
	description:
		"Envía un reporte SIRE a SUNAT. Requiere fiscal_gate — AI propone, governance bundle valida, humano autoriza.",
	inputSchema: z.object({
		companyId: z.string(),
		period: z.string(),
		ledgerType: z.enum(["ventas", "compras"]),
		payloadBase64: z.string(),
		payloadFormat: z.enum(["txt", "csv", "json", "xml"]).default("txt"),
	}),
	outputSchema: z.object({
		submissionId: z.string(),
		status: z.string(),
		trackingId: z.string().optional(),
	}),
	approvalLevel: "fiscal_gate",
	async execute(input: unknown, _context: AgentContext) {
		const inp = input as {
			companyId: string;
			period: string;
			ledgerType: "ventas" | "compras";
			payloadBase64: string;
			payloadFormat: string;
		};
		const { SireSubmissionService } = await import(
			"../../sire/sire-submission.service"
		);
		const result = await SireSubmissionService.submit({
			companyId: inp.companyId,
			period: inp.period,
			ledgerType: inp.ledgerType,
			payloadBase64: inp.payloadBase64,
			payloadFormat: inp.payloadFormat as "txt" | "csv" | "json" | "xml",
		});
		return {
			submissionId: result.submissionId,
			status: result.status,
			trackingId: result.sunatTicket ?? result.trackingId,
		};
	},
};

/**
 * validateCpeTool const.
 *
 * @example
 * ```ts
 * console.log(validateCpeTool);
 * ```
 */
export const validateCpeTool: AgentTool = {
	name: "validate_cpe",
	description:
		"Valida un comprobante electrónico (CPE) contra esquemas UBL y SUNAT. Retorna estado de validación con detección de breaches.",
	inputSchema: z.object({
		companyRuc: z.string().length(11),
		cpeNumber: z.string(),
		xmlContent: z.string(),
		issueDate: z.string(),
		totalAmount: z.number(),
	}),
	outputSchema: z.object({
		isValid: z.boolean(),
		status: z.string(),
		errors: z.array(z.any()),
		durationMs: z.number(),
	}),
	approvalLevel: "auto",
	async execute(input: unknown, _context: AgentContext) {
		const inp = input as {
			companyRuc: string;
			cpeNumber: string;
			xmlContent: string;
			issueDate: string;
			totalAmount: number;
		};
		const { validateCpe } = await import(
			"../../cpe-validator/application/commands/validate-cpe.command"
		);
		const result = await validateCpe({
			companyRuc: inp.companyRuc,
			cpeNumber: inp.cpeNumber,
			xmlContent: inp.xmlContent,
			issueDate: inp.issueDate,
			totalAmount: inp.totalAmount,
		});
		return {
			isValid: result.isValid,
			status: result.status,
			errors: result.errors,
			durationMs: result.durationMs,
		};
	},
};

/**
 * getTaxCalendarTool const.
 *
 * @example
 * ```ts
 * console.log(getTaxCalendarTool);
 * ```
 */
export const getTaxCalendarTool: AgentTool = {
	name: "get_tax_calendar",
	description:
		"Obtiene el calendario fiscal SUNAT con fechas de vencimiento para declaraciones.",
	inputSchema: z.object({ year: z.number().optional() }),
	outputSchema: z.object({
		events: z.array(
			z.object({
				month: z.number(),
				deadline: z.string(),
				description: z.string(),
			}),
		),
	}),
	approvalLevel: "auto",
	async execute(_input: unknown, _context: AgentContext) {
		return {
			events: [
				{ month: 1, deadline: "2026-02-15", description: "IGV Enero" },
				{ month: 2, deadline: "2026-03-15", description: "IGV Febrero" },
				{ month: 3, deadline: "2026-04-15", description: "IGV Marzo" },
			],
		};
	},
};

/**
 * complianceTools const.
 *
 * @example
 * ```ts
 * console.log(complianceTools);
 * ```
 */
export const complianceTools: AgentTool[] = [
	calculateIgvTool,
	submitSireTool,
	validateCpeTool,
	getTaxCalendarTool,
];
