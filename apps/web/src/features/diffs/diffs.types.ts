export type DiffType =
	| "journalEntry"
	| "journalModify"
	| "taxImpact"
	| "reconciliation"
	| "compliance"
	| "risk";
export type DiffStatus = "pending" | "approved" | "rejected" | "info_requested";
export type QueuePriority = "critical" | "high" | "medium" | "low";

export interface DiffDTO {
	id: string;
	threadId: string;
	title: string;
	type: DiffType;
	status: DiffStatus;
	priority: QueuePriority;
	riskScore: number;
	confidence: number;
	changesCount: number;
	createdAt: string;
}

export interface DiffChangeDTO {
	field: string;
	before: unknown;
	after: unknown;
}

export interface DiffImpactDTO {
	taxImpact?: { amount: number; currency: string; concept: string };
	riskScore: number;
	confidence: number;
}

export interface DiffDetailDTO extends DiffDTO {
	changes: DiffChangeDTO[];
	impact: DiffImpactDTO;
	evidenceIds: string[];
	/** Reporte de verificación intención↔acción, cuando el diff tiene un agent run asociado */
	verificationReport?: import("@/stores/agentic-shell.store").VerificationReport;
	reviewerId?: string;
	rejectionReason?: string;
	pendingQuestion?: string;
	decisions: Array<{
		action: string;
		comment?: string;
		reviewerId: string;
		timestamp: string;
	}>;
}

export interface DiffFilters {
	status?: string;
	type?: string;
	priority?: string;
}
