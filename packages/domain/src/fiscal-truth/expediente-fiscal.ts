import type {
	FiscalActionContext,
	FiscalEvidenceItem,
} from "./fiscal-pipeline";

/**
 * Expediente Fiscal — the ARKELYTHEX equivalent of a dossier/thread.
 *
 * Groups fiscal documents, evidence, agent analyses, and approvals
 * for a specific company + period + process combination.
 */

export type ExpedienteKind =
	| "CIERRE_MENSUAL"
	| "SIRE_COMPRAS"
	| "SIRE_VENTAS"
	| "CONCILIACION_BANCARIA"
	| "AUDITORIA_FISCAL"
	| "DECLARACION_JURADA"
	| "DETRACCIONES"
	| "PERCEPCIONES"
	| "RETENCIONES"
	| "GENERAL";

export type ExpedienteStatus =
	| "ABIERTO"
	| "EN_PROCESO"
	| "PENDIENTE_REVISION"
	| "PENDIENTE_APROBACION"
	| "CERRADO"
	| "ARCHIVADO";

export const EXPEDIENTE_STATUS_LABELS: Record<ExpedienteStatus, string> = {
	ABIERTO: "Abierto",
	EN_PROCESO: "En proceso",
	PENDIENTE_REVISION: "Pendiente revisión",
	PENDIENTE_APROBACION: "Pendiente aprobación",
	CERRADO: "Cerrado",
	ARCHIVADO: "Archivado",
};

export const EXPEDIENTE_KIND_LABELS: Record<ExpedienteKind, string> = {
	CIERRE_MENSUAL: "Cierre Mensual",
	SIRE_COMPRAS: "SIRE Compras",
	SIRE_VENTAS: "SIRE Ventas",
	CONCILIACION_BANCARIA: "Conciliación Bancaria",
	AUDITORIA_FISCAL: "Auditoría Fiscal",
	DECLARACION_JURADA: "Declaración Jurada",
	DETRACCIONES: "Detracciones",
	PERCEPCIONES: "Percepciones",
	RETENCIONES: "Retenciones",
	GENERAL: "General",
};

export interface DocumentoFiscal {
	id: string;
	expedienteId: string;
	tipo:
		| "FACTURA"
		| "BOLETA"
		| "NOTA_CREDITO"
		| "NOTA_DEBITO"
		| "CDR"
		| "XML_UBL"
		| "SIRE_REPORTE"
		| "CONCILIACION"
		| "ASIENTO_CONTABLE"
		| "DECLARACION"
		| "OTRO";
	label: string;
	numero: string;
	fechaEmision: string;
	monto?: { valor: number; moneda: "PEN" | "USD" };
	rucEmisor?: string;
	rucReceptor?: string;
	hash: string;
	url?: string;
	verificado: boolean;
}

export interface ExpedienteFiscal {
	id: string;
	companyRuc: string;
	companyName: string;
	periodo: string; // "2026-04"
	kind: ExpedienteKind;
	status: ExpedienteStatus;
	titulo: string;
	descripcion: string;
	createdAt: string;
	updatedAt: string;
	closedAt?: string;
	/** Fiscal actions associated with this expediente */
	acciones: FiscalActionContext[];
	/** Documents bundled in this expediente */
	documentos: DocumentoFiscal[];
	/** Evidence items for the expediente as a whole */
	evidencia: FiscalEvidenceItem[];
	/** Required approvers to close this expediente */
	requiredApprovers: string[];
	/** Who has already approved */
	approvedBy: string[];
	/** Agent analysis summary if agents were involved */
	agentSummary?: string;
	/** Risk level for the expediente as a whole */
	globalRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
	/** Total actions pending in this expediente */
	pendingActions: number;
	/** Total documents in this expediente */
	totalDocuments: number;
}

export interface CierreMensualChecklistItem {
	id: string;
	label: string;
	descripcion: string;
	completado: boolean;
	requiereEvidencia: boolean;
	evidencia?: FiscalEvidenceItem[];
	riesgo: "LOW" | "MEDIUM" | "HIGH";
	orden: number;
}

export interface CierreMensual {
	id: string;
	companyRuc: string;
	companyName: string;
	periodo: string; // "2026-04"
	status: ExpedienteStatus;
	startedAt: string;
	completedAt?: string;
	/** Sequential checklist items */
	checklist: CierreMensualChecklistItem[];
	/** Overall progress 0-1 */
	progress: number;
	/** Active agent analysis */
	agentAnalysis?: {
		agentId: string;
		agentName: string;
		confidence: number;
		summary: string;
		discrepancies: number;
		recommendations: string[];
	};
	/** Linked fiscal expediente */
	expedienteId: string;
	/** Required signatures */
	firmas: {
		contador?: { firmado: boolean; fecha?: string };
		revisor?: { firmado: boolean; fecha?: string };
		representante?: { firmado: boolean; fecha?: string };
	};
	/** SIRE reconciliation status */
	sireStatus: "PENDIENTE" | "CONCILIADO" | "CON_DISCREPANCIAS" | "NO_APLICA";
	/** Banking reconciliation status */
	bancosStatus: "PENDIENTE" | "CONCILIADO" | "CON_DISCREPANCIAS" | "NO_APLICA";
	/** IGV validation status */
	igvStatus: "PENDIENTE" | "VALIDADO" | "CON_DISCREPANCIAS" | "NO_APLICA";
	/** Risk summary for the entire closing */
	globalRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

/**
 * Default checklist for Cierre Mensual.
 * Each module can extend or override this.
 */
export function buildDefaultCierreChecklist(
	expedienteId: string,
): CierreMensualChecklistItem[] {
	return [
		{
			id: `${expedienteId}-chk-01`,
			label: "Conciliación bancaria",
			descripcion:
				"Verificar que todos los movimientos bancarios coincidan con el ledger.",
			completado: false,
			requiereEvidencia: true,
			riesgo: "HIGH",
			orden: 1,
		},
		{
			id: `${expedienteId}-chk-02`,
			label: "Validación SIRE Compras",
			descripcion:
				"Cruzar comprobantes de compras con el registro SIRE de SUNAT.",
			completado: false,
			requiereEvidencia: true,
			riesgo: "HIGH",
			orden: 2,
		},
		{
			id: `${expedienteId}-chk-03`,
			label: "Validación SIRE Ventas",
			descripcion:
				"Cruzar comprobantes de ventas con el registro SIRE de SUNAT.",
			completado: false,
			requiereEvidencia: true,
			riesgo: "HIGH",
			orden: 3,
		},
		{
			id: `${expedienteId}-chk-04`,
			label: "Cálculo y verificación IGV",
			descripcion: "Validar que el IGV de compras y ventas sea correcto (18%).",
			completado: false,
			requiereEvidencia: false,
			riesgo: "HIGH",
			orden: 4,
		},
		{
			id: `${expedienteId}-chk-05`,
			label: "Detracciones y percepciones",
			descripcion: "Verificar detracciones SPOT y percepciones aplicables.",
			completado: false,
			requiereEvidencia: true,
			riesgo: "MEDIUM",
			orden: 5,
		},
		{
			id: `${expedienteId}-chk-06`,
			label: "Retenciones",
			descripcion: "Verificar retenciones de 4ta y 5ta categoría.",
			completado: false,
			requiereEvidencia: false,
			riesgo: "MEDIUM",
			orden: 6,
		},
		{
			id: `${expedienteId}-chk-07`,
			label: "Revisión de asientos contables",
			descripcion:
				"Revisar que todos los asientos del período estén cuadrados.",
			completado: false,
			requiereEvidencia: false,
			riesgo: "MEDIUM",
			orden: 7,
		},
		{
			id: `${expedienteId}-chk-08`,
			label: "Generación de paquete de evidencia",
			descripcion:
				"Generar ZIP con todos los documentos, CDRs, reportes y conciliaciones.",
			completado: false,
			requiereEvidencia: true,
			riesgo: "LOW",
			orden: 8,
		},
		{
			id: `${expedienteId}-chk-09`,
			label: "Firma del contador",
			descripcion:
				"Firma digital del contador general sobre el paquete de cierre.",
			completado: false,
			requiereEvidencia: true,
			riesgo: "HIGH",
			orden: 9,
		},
		{
			id: `${expedienteId}-chk-10`,
			label: "Firma del representante legal",
			descripcion:
				"Firma digital del representante legal sobre el cierre validado.",
			completado: false,
			requiereEvidencia: true,
			riesgo: "HIGH",
			orden: 10,
		},
	];
}

/**
 * Calculates the progress (0-1) of a cierre mensual checklist.
 */
export function calculateCierreProgress(
	checklist: CierreMensualChecklistItem[],
): number {
	if (checklist.length === 0) return 0;
	const completed = checklist.filter((item) => item.completado).length;
	return completed / checklist.length;
}

/**
 * Status color mapping for expedientes.
 */
export const EXPEDIENTE_STATUS_COLORS: Record<ExpedienteStatus, string> = {
	ABIERTO: "var(--color-info)",
	EN_PROCESO: "var(--color-info)",
	PENDIENTE_REVISION: "var(--color-warning)",
	PENDIENTE_APROBACION: "var(--color-warning)",
	CERRADO: "var(--color-success)",
	ARCHIVADO: "var(--color-text-disabled)",
};
