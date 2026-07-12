import type { DiffType, QueuePriority } from "../diffs/diffs.types";

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

export interface QueueFilters {
	priority?: string;
	status?: string;
	client?: string;
	period?: string;
	agentType?: string;
	type?: string;
}
