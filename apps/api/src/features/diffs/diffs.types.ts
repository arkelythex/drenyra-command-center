import type { DiffStatus, DiffType, QueuePriority } from "@drenyra/domain";

export interface DiffChangeDTO {
	field: string;
	before: unknown;
	after: unknown;
}

export interface DiffImpactDTO {
	taxImpact?: {
		amount: number;
		currency: string;
		concept: string;
	};
	riskScore: number;
	confidence: number;
}

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

export interface DiffDetailDTO extends DiffDTO {
	changes: DiffChangeDTO[];
	impact: DiffImpactDTO;
	evidenceIds: string[];
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

export interface ReviewQueueItemDTO {
	id: string;
	diffId: string;
	title: string;
	type: DiffType;
	priority: QueuePriority;
	status: string;
	clientName: string;
	period: string;
	agentName: string;
	riskScore: number;
	createdAt: string;
}

export interface ReviewQueueStatsDTO {
	pending: number;
	critical: number;
	high: number;
	medium: number;
	low: number;
	overdue: number;
}
