/**
 * Fiscal Operating System — Unified Action Pipeline
 *
 * Every fiscal action in ARKELYTHEX follows a 7-step pipeline:
 *   DETECTED → ANALYZED → PROPOSED → VALIDATED → APPROVED → EXECUTED → EVIDENCED
 *
 * This file defines the canonical types shared across all modules.
 */

/**
 * Risk level assigned to every fiscal action.
 * Determines whether auto-approval is allowed or human intervention is required.
 */
export type FiscalRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/**
 * The 7-step fiscal action pipeline.
 *
 * Invariant: actions MUST progress sequentially through this chain.
 * Skipping steps is only allowed for LOW-risk actions where
 * ANALYZED → VALIDATED can be automated.
 */
export const FISCAL_ACTION_STATUS = {
	DETECTED: "DETECTED",
	ANALYZED: "ANALYZED",
	PROPOSED: "PROPOSED",
	VALIDATED: "VALIDATED",
	APPROVED: "APPROVED",
	EXECUTED: "EXECUTED",
	EVIDENCED: "EVIDENCED",
	REJECTED: "REJECTED",
} as const;

export type FiscalActionStatus =
	(typeof FISCAL_ACTION_STATUS)[keyof typeof FISCAL_ACTION_STATUS];

/**
 * Human-readable labels for each status step.
 */
export const FISCAL_ACTION_STATUS_LABELS: Record<FiscalActionStatus, string> = {
	DETECTED: "Detectado",
	ANALYZED: "Analizado",
	PROPOSED: "Propuesto",
	VALIDATED: "Validado",
	APPROVED: "Aprobado",
	EXECUTED: "Ejecutado",
	EVIDENCED: "Evidenciado",
	REJECTED: "Rechazado",
};

/**
 * Ordered array of statuses for progress visualization.
 */
export const FISCAL_ACTION_STATUS_ORDER: readonly FiscalActionStatus[] = [
	"DETECTED",
	"ANALYZED",
	"PROPOSED",
	"VALIDATED",
	"APPROVED",
	"EXECUTED",
	"EVIDENCED",
] as const;

/**
 * Evidence item attached to a fiscal action.
 */
export interface FiscalEvidenceItem {
	id: string;
	kind: "CDR" | "UBL" | "SIRE" | "XML" | "PDF" | "HASH" | "SCREENSHOT" | "LOG";
	label: string;
	hash: string;
	verified: boolean;
	attachedAt: string;
	url?: string;
}

/**
 * Agent analysis result attached to a fiscal action.
 */
export interface FiscalAgentAnalysis {
	agentId: string;
	agentName: string;
	confidence: number; // 0–1
	proposal: string;
	rationale: string;
	detectedAt: string;
	risks: string[];
}

/**
 * The core fiscal action wrapper used by the FiscalInspector.
 */
export interface FiscalActionContext {
	/** Unique trace ID for this action */
	traceId: string;
	/** Human-readable summary of the action */
	summary: string;
	/** Current status in the 7-step pipeline */
	status: FiscalActionStatus;
	/** Risk level assigned to this action */
	riskLevel: FiscalRiskLevel;
	/** Fiscal impact description (e.g. "IGV crédito fiscal", "Renta 3ra categoría") */
	impact: string;
	/** Who or what proposed this action */
	proposedBy: "agent" | "system" | "contador" | "auditor";
	/** Whether this action requires human approval before execution */
	requiresApproval: boolean;
	/** Module that originated this action */
	module:
		| "facturacion"
		| "compras"
		| "ventas"
		| "sire"
		| "conciliacion"
		| "cierre"
		| "bancos"
		| "nomina"
		| "impuestos";
	/** Company RUC this action belongs to */
	companyRuc: string;
	/** When this action was created */
	createdAt: string;
	/** Agent analysis if an agent proposed this */
	agentAnalysis?: FiscalAgentAnalysis;
	/** Evidence items attached to this action */
	evidence: FiscalEvidenceItem[];
	/** Required approvers (for HIGH/CRITICAL risk) */
	requiredApprovers?: string[];
	/** Who has already approved */
	approvedBy?: string[];
	/** Who rejected (if status is REJECTED) */
	rejectedBy?: string;
	/** Rejection reason */
	rejectionReason?: string;
}

/**
 * Returns whether auto-approval is allowed for a given risk level.
 */
export function canAutoApprove(riskLevel: FiscalRiskLevel): boolean {
	return riskLevel === "LOW";
}

/**
 * Returns whether dual signature is required.
 */
export function requiresDualSignature(riskLevel: FiscalRiskLevel): boolean {
	return riskLevel === "HIGH" || riskLevel === "CRITICAL";
}

/**
 * Returns the next status in the pipeline.
 */
export function nextStatus(
	current: FiscalActionStatus,
): FiscalActionStatus | null {
	const idx = FISCAL_ACTION_STATUS_ORDER.indexOf(current as FiscalActionStatus);
	if (idx === -1 || idx >= FISCAL_ACTION_STATUS_ORDER.length - 1) return null;
	return FISCAL_ACTION_STATUS_ORDER[idx + 1] as FiscalActionStatus;
}

/**
 * Color mapping for risk levels.
 */
export const FISCAL_RISK_COLORS: Record<FiscalRiskLevel, string> = {
	LOW: "var(--color-success)",
	MEDIUM: "var(--color-warning)",
	HIGH: "var(--color-danger)",
	CRITICAL: "var(--color-danger)",
};

/**
 * Color mapping for status steps.
 */
export const FISCAL_ACTION_STATUS_COLORS: Record<FiscalActionStatus, string> = {
	DETECTED: "var(--color-text-muted)",
	ANALYZED: "var(--color-info)",
	PROPOSED: "var(--color-info)",
	VALIDATED: "var(--color-info)",
	APPROVED: "var(--color-success)",
	EXECUTED: "var(--color-success)",
	EVIDENCED: "var(--color-success)",
	REJECTED: "var(--color-danger)",
};
