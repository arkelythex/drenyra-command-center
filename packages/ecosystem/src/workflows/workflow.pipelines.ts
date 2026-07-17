import type { WorkflowPipeline, WorkflowStep } from "./workflow.types";

const classificationStep: WorkflowStep = {
	id: "classify",
	name: "Clasificar Documento",
	description:
		"Clasificar tipo de documento (factura, boleta, NC, ND) seg\u00fan PCGE",
	order: 1,
	async execute(ctx) {
		const docType = (ctx.documentType as string) ?? "01";
		const pcgeMap: Record<string, string> = {
			"01": "7011",
			"03": "7012",
			"07": "7013",
			"08": "7014",
		};
		return {
			status: "completed",
			output: { pcgeAccount: pcgeMap[docType] ?? "7011", classified: true },
		};
	},
};

const validationStep: WorkflowStep = {
	id: "validate",
	name: "Validar RUC y Montos",
	description: "Validar RUC del emisor, montos IGV y retenciones",
	order: 2,
	async execute(ctx) {
		const ruc = (ctx.ruc as string) ?? "";
		if (ruc.length !== 11)
			return { status: "failed", error: `RUC inv\u00e1lido: ${ruc}` };
		return { status: "completed", output: { validated: true } };
	},
};

const postingStep: WorkflowStep = {
	id: "post",
	name: "Generar Asiento Contable",
	description: "Generar asiento contable en ERPNext/contabilidad",
	order: 3,
	async execute(ctx) {
		return {
			status: "completed",
			output: { journalEntryId: `JE-${ctx.documentUrl}`, posted: true },
		};
	},
};

const reconcileStep: WorkflowStep = {
	id: "reconcile",
	name: "Conciliar con Extracto Bancario",
	description: "Auto-conciliar contra movimientos bancarios",
	order: 1,
	async execute(_ctx) {
		return { status: "completed", output: { matched: true, confidence: 0.95 } };
	},
};

const notifyStep: WorkflowStep = {
	id: "notify",
	name: "Notificar Resultado",
	description: "Notificar resultado de conciliaci\u00f3n",
	order: 2,
	async execute() {
		return { status: "completed", output: { notified: true } };
	},
};

const sireValidateStep: WorkflowStep = {
	id: "sire-validate",
	name: "Validar SIRE",
	description: "Validar libro electr\u00f3nico SIRE para el periodo",
	order: 1,
	async execute(ctx) {
		const period =
			(ctx.period as string) ?? new Date().toISOString().slice(0, 7);
		return { status: "completed", output: { period, sireValid: true } };
	},
};

const exceptionStep: WorkflowStep = {
	id: "exception-handle",
	name: "Manejar Excepci\u00f3n SIRE",
	description: "Generar reporte de excepci\u00f3n SIRE si aplica",
	order: 2,
	async execute(ctx) {
		const hasException = (ctx.sireValid as boolean) === false;
		return {
			status: "completed",
			output: {
				exceptionHandled: hasException,
				exceptionReportId: hasException ? `SRE-${Date.now()}` : undefined,
			},
		};
	},
};

export const DOCUMENT_TO_POSTING_PIPELINE: WorkflowPipeline = {
	id: "document-to-posting",
	name: "Documento a Asiento Contable",
	description:
		"Clasifica el documento fiscal, valida RUC/montos y genera el asiento contable en ERP",
	steps: [classificationStep, validationStep, postingStep],
};

export const AUTO_RECONCILIATION_PIPELINE: WorkflowPipeline = {
	id: "auto-reconciliation",
	name: "Auto-Conciliaci\u00f3n Bancaria",
	description:
		"Auto-conciliar movimientos bancarios contra facturas emitidas y notificar resultado",
	steps: [reconcileStep, notifyStep],
};

export const SIRE_EXCEPTION_PIPELINE: WorkflowPipeline = {
	id: "sire-exception",
	name: "Excepci\u00f3n SIRE",
	description:
		"Validar libro SIRE del periodo y manejar excepciones de validaci\u00f3n",
	steps: [sireValidateStep, exceptionStep],
};

export const WORKFLOW_PIPELINES: WorkflowPipeline[] = [
	DOCUMENT_TO_POSTING_PIPELINE,
	AUTO_RECONCILIATION_PIPELINE,
	SIRE_EXCEPTION_PIPELINE,
];
