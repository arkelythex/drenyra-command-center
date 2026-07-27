/**
 * R0-R3 Approval Gate model for the Workbench.
 *
 * Each approval level has distinct UX requirements:
 * - R0 (Read): No friction. Explain, compare, summarize.
 * - R1 (Reversible): Fast action with undo/discard.
 * - R2 (Internal material): Mandatory preview. What changes, impact, entities, evidence, policy, rollback.
 * - R3 (External execution): Step-up auth. Authority, company, period, action, docs, materiality, policy, prepared/approved by.
 */

export type ApprovalLevel = "R0" | "R1" | "R2" | "R3";

export type ApprovalDecision = "approved" | "rejected" | "pending";

export interface ApprovalGateInfo {
	level: ApprovalLevel;
	label: string;
	description: string;
	color: string;
	icon: string;
	requiresAuth: boolean;
	requiresPreview: boolean;
	requiresEvidence: boolean;
	requiresSecondApproval: boolean;
}

export const APPROVAL_LEVELS: Record<ApprovalLevel, ApprovalGateInfo> = {
	R0: {
		level: "R0",
		label: "Lectura",
		description: "Consulta sin riesgo. Explicar, comparar, resumir.",
		color: "blue",
		icon: "Eye",
		requiresAuth: false,
		requiresPreview: false,
		requiresEvidence: false,
		requiresSecondApproval: false,
	},
	R1: {
		level: "R1",
		label: "Reversible",
		description: "Acción rápida con undo. Propuestas, notas, borradores.",
		color: "green",
		icon: "Undo2",
		requiresAuth: false,
		requiresPreview: true,
		requiresEvidence: false,
		requiresSecondApproval: false,
	},
	R2: {
		level: "R2",
		label: "Cambio interno",
		description:
			"Cambio material interno. Preview obligatorio: impacto, entidades, evidencia, política, rollback.",
		color: "amber",
		icon: "FileWarning",
		requiresAuth: false,
		requiresPreview: true,
		requiresEvidence: true,
		requiresSecondApproval: false,
	},
	R3: {
		level: "R3",
		label: "Ejecución externa",
		description:
			"Ejecución ante SUNAT/OSE. Step-up auth, separar preparar de ejecutar, receipt requerido.",
		color: "red",
		icon: "ShieldAlert",
		requiresAuth: true,
		requiresPreview: true,
		requiresEvidence: true,
		requiresSecondApproval: true,
	},
};

export interface ApprovalRequest {
	id: string;
	level: ApprovalLevel;
	title: string;
	description: string;
	companyName: string;
	companyRuc: string;
	period: string;
	requestedBy: string;
	requestedAt: string;

	// R2/R3 fields
	impact?: {
		ebitda?: number;
		assets?: number;
		taxImpact?: number;
		currency: string;
	};
	affectedEntities?: string[];
	evidenceCount?: number;
	policyVersion?: string;
	rollbackMethod?: string;

	// R3 only
	authority?: string; // e.g. "SUNAT"
	action?: string; // e.g. "Submit replacement RCE"
	documentCount?: number;
	materiality?: string;

	// Decision
	decision: ApprovalDecision;
	decidedBy?: string;
	decidedAt?: string;
	rejectionReason?: string;
	approvedBySecond?: string;

	// Receipt (after R3 execution)
	receiptId?: string;
	officialResponse?: string;
	statusAfterExecution?: "confirmed" | "failed" | "unknown";
}
