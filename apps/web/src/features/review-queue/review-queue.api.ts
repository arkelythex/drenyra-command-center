import { api, getGovernanceAuditHeaders } from "@/lib/api";
import { unwrap } from "@/lib/api-helpers";
import type {
	QueueFilters,
	ReviewQueueItemDTO,
	ReviewQueueStatsDTO,
} from "./review-queue.types";

export async function listQueue(filters?: QueueFilters) {
	return unwrap(
		api.api["review-queue"].get({
			query: {
				...(filters?.priority && { priority: filters.priority }),
				...(filters?.status && { status: filters.status }),
				...(filters?.client && { client: filters.client }),
				...(filters?.period && { period: filters.period }),
			},
			headers: getGovernanceAuditHeaders(),
		}),
	) as Promise<{ data: ReviewQueueItemDTO[] }>;
}

export async function getQueueStats() {
	return unwrap(
		api.api["review-queue"].stats.get({
			headers: getGovernanceAuditHeaders(),
		}),
	) as Promise<ReviewQueueStatsDTO>;
}

export async function batchApprove(ids: string[]) {
	return unwrap(
		api.api["review-queue"]["batch-approve"].post(
			{ ids },
			{ headers: getGovernanceAuditHeaders() },
		),
	) as Promise<{ approved: number; failed: number }>;
}
