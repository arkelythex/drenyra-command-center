import { api } from "@/lib/api";
import { unwrap } from "@/lib/api-helpers";

// ── Types matching backend ThreadSummary / ThreadDetail ──────────────────────

export interface ThreadSummary {
	id: string;
	companyId: string;
	title: string;
	status: string;
	environment: string;
	period?: string;
	priority: string;
	tags: string[];
	taskCount: number;
	completedTaskCount: number;
	agentCount: number;
	lastActivityAt: string;
	createdAt: string;
}

export interface ThreadTaskDTO {
	id: string;
	title: string;
	description?: string;
	status: string;
	agentId?: string;
	assignedAt?: string;
	completedAt?: string;
	completedById?: string;
	resultSummary?: string;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface ThreadAgentDTO {
	agentId: string;
	agentName: string;
	role: string;
	isActive: boolean;
	assignedAt: string;
}

export interface ThreadDetail {
	id: string;
	companyId: string;
	title: string;
	description?: string;
	status: string;
	environment: string;
	period?: string;
	priority: string;
	tags: string[];
	tasks: ThreadTaskDTO[];
	agents: ThreadAgentDTO[];
	evidenceIds: string[];
	createdById?: string;
	createdAt: string;
	updatedAt: string;
	closedAt?: string;
	closedById?: string;
	closeNote?: string;
}

export interface QuickActionDTO {
	id: string;
	label: string;
	description: string;
	category: string;
	suggestedTasks: { title: string; description?: string }[];
}

export interface CreateThreadData {
	companyId: string;
	title: string;
	description?: string;
	environment?: string;
	period?: string;
	priority?: string;
	tasks: { title: string; description?: string }[];
}

export interface PaginatedThreads {
	data: ThreadSummary[];
	total: number;
	limit: number;
	offset: number;
}

export interface ThreadFilters {
	companyId?: string;
	status?: string;
	period?: string;
	priority?: string;
	search?: string;
	limit?: number;
	offset?: number;
}

// ── API calls ───────────────────────────────────────────────────────────────

export async function listThreads(
	filters?: ThreadFilters,
): Promise<PaginatedThreads> {
	const params: Record<string, string> = {};
	if (filters?.status) params.status = filters.status;
	if (filters?.period) params.period = filters.period;
	if (filters?.search) params.search = filters.search;
	if (filters?.limit) params.limit = String(filters.limit);
	if (filters?.offset) params.offset = String(filters.offset);
	if (filters?.companyId) params.companyId = filters.companyId;

	return unwrap(
		api.api.threads.index.get({ query: params }),
	) as Promise<PaginatedThreads>;
}

export async function getThread(id: string): Promise<ThreadDetail> {
	return unwrap(api.api.threads({ id }).get()) as Promise<ThreadDetail>;
}

export async function createThread(
	data: CreateThreadData,
): Promise<ThreadDetail> {
	return unwrap(api.api.threads.index.post(data)) as Promise<ThreadDetail>;
}

export async function updateThread(
	id: string,
	data: Partial<CreateThreadData>,
): Promise<ThreadDetail> {
	return unwrap(api.api.threads({ id }).patch(data)) as Promise<ThreadDetail>;
}

export async function closeThread(
	id: string,
	note?: string,
): Promise<ThreadDetail> {
	return unwrap(
		api.api.threads({ id }).close.post({ closeNote: note }),
	) as Promise<ThreadDetail>;
}

export async function getQuickActions(
	companyId?: string,
	period?: string,
): Promise<QuickActionDTO[]> {
	const params: Record<string, string> = {};
	if (companyId) params.companyId = companyId;
	if (period) params.period = period;

	return unwrap(
		api.api.threads["quick-actions"].get({ query: params }),
	) as Promise<QuickActionDTO[]>;
}
