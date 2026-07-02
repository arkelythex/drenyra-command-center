/**
 * Threads API client
 *
 * Eden Treaty-based API client for all thread CRUD and state transitions.
 * Follows the ok()/fail() + unwrap() pattern consistent with the rest of the app.
 */

import { api, getGovernanceAuditHeaders } from "@/lib/api";
import { unwrap } from "@/lib/api-helpers";
import type {
	AssignAgentPayload,
	CreateTaskInThreadPayload,
	CreateThreadPayload,
	PaginatedResult,
	QuickAction,
	ThreadDetail,
	ThreadFilters,
	ThreadSummary,
	ThreadTask,
	UpdateTaskPayload,
	UpdateThreadPayload,
} from "./threads.types";

// ─── Thread CRUD ─────────────────────────────────────────────────────────────

export async function listThreads(filters?: ThreadFilters): Promise<PaginatedResult<ThreadSummary>> {
	return unwrap(
		api.api.threads.get({
			query: {
				...(filters?.status && { status: filters.status }),
				...(filters?.period && { period: filters.period }),
				...(filters?.priority && { priority: filters.priority }),
				...(filters?.search && { search: filters.search }),
				...(filters?.limit !== undefined && { limit: String(filters.limit) }),
				...(filters?.offset !== undefined && { offset: String(filters.offset) }),
			},
			headers: getGovernanceAuditHeaders(),
		}),
	);
}

export async function getThread(id: string): Promise<ThreadDetail> {
	return unwrap(
		api.api.threads({ id }).get({
			headers: getGovernanceAuditHeaders(),
		}),
	);
}

export async function createThread(data: CreateThreadPayload): Promise<ThreadSummary> {
	return unwrap(
		api.api.threads.post(data, {
			headers: getGovernanceAuditHeaders(),
		}),
	);
}

export async function updateThread(id: string, data: UpdateThreadPayload): Promise<ThreadSummary> {
	return unwrap(
		api.api.threads({ id }).patch(data, {
			headers: getGovernanceAuditHeaders(),
		}),
	);
}

// ─── Agent Management ────────────────────────────────────────────────────────

export async function assignAgent(
	threadId: string,
	data: AssignAgentPayload,
): Promise<{ agentId: string; agentName: string; role: string; isActive: boolean; assignedAt: string }> {
	return unwrap(
		api.api.threads({ id: threadId }).agents.post(data, {
			headers: getGovernanceAuditHeaders(),
		}),
	);
}

export async function removeAgent(threadId: string, agentId: string): Promise<void> {
	await unwrap(
		api.api.threads({ id: threadId }).agents({ agentId }).delete({
			headers: getGovernanceAuditHeaders(),
		}),
	);
}

// ─── Evidence ────────────────────────────────────────────────────────────────

export async function linkEvidence(
	threadId: string,
	evidenceId: string,
	note?: string,
): Promise<{ linked: boolean }> {
	return unwrap(
		api.api.threads({ id: threadId }).evidence.post(
			{ evidenceId, note },
			{ headers: getGovernanceAuditHeaders() },
		),
	);
}

export async function unlinkEvidence(threadId: string, evidenceId: string): Promise<void> {
	await unwrap(
		api.api.threads({ id: threadId }).evidence({ evidenceId }).delete({
			headers: getGovernanceAuditHeaders(),
		}),
	);
}

// ─── Close ───────────────────────────────────────────────────────────────────

export async function closeThread(id: string, closeNote?: string): Promise<ThreadSummary> {
	return unwrap(
		api.api.threads({ id }).close.post(
			{ closeNote },
			{ headers: getGovernanceAuditHeaders() },
		),
	);
}

// ─── Task Management ─────────────────────────────────────────────────────────

export async function createTask(
	threadId: string,
	data: CreateTaskInThreadPayload,
): Promise<ThreadTask> {
	return unwrap(
		api.api.threads({ id: threadId }).tasks.post(data, {
			headers: getGovernanceAuditHeaders(),
		}),
	);
}

export async function updateTask(
	threadId: string,
	taskId: string,
	data: UpdateTaskPayload,
): Promise<ThreadTask> {
	return unwrap(
		api.api.threads({ id: threadId }).tasks({ taskId }).patch(data, {
			headers: getGovernanceAuditHeaders(),
		}),
	);
}

// ─── Quick Actions ───────────────────────────────────────────────────────────

export async function getQuickActions(
	companyId: string,
	period?: string,
): Promise<QuickAction[]> {
	const result = await unwrap(
		api.api.threads["quick-actions"].get({
			query: {
				companyId,
				...(period && { period }),
			},
			headers: getGovernanceAuditHeaders(),
		}),
	);
	// The API returns ok(result) where result.data is the array
	return (result as unknown as { data: QuickAction[] }).data ?? (result as QuickAction[]);
}
