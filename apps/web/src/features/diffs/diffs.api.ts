import { api, getGovernanceAuditHeaders } from "@/lib/api";
import { unwrap } from "@/lib/api-helpers";
import type { DiffDetailDTO, DiffFilters } from "./diffs.types";

export async function listDiffs(filters?: DiffFilters) {
	return unwrap(
		api.api.diffs.get({
			query: {
				...(filters?.status && { status: filters.status }),
				...(filters?.type && { type: filters.type }),
				...(filters?.priority && { priority: filters.priority }),
			},
			headers: getGovernanceAuditHeaders(),
		}),
	) as Promise<{ data: DiffDetailDTO[]; total: number }>;
}

export async function getDiff(id: string) {
	return unwrap(
		api.api.diffs({ id }).get({ headers: getGovernanceAuditHeaders() }),
	) as Promise<DiffDetailDTO>;
}

export async function approveDiff(id: string) {
	return unwrap(
		api.api.diffs({ id }).approve.post(undefined, {
			headers: getGovernanceAuditHeaders(),
		}),
	) as Promise<{ success: boolean }>;
}

export async function rejectDiff(id: string, reason: string) {
	return unwrap(
		api.api
			.diffs({ id })
			.reject.post({ reason }, { headers: getGovernanceAuditHeaders() }),
	) as Promise<{ success: boolean }>;
}

export async function requestDiffInfo(id: string, question: string) {
	return unwrap(
		api.api
			.diffs({ id })
			["request-info"].post(
				{ question },
				{ headers: getGovernanceAuditHeaders() },
			),
	) as Promise<{ success: boolean }>;
}
