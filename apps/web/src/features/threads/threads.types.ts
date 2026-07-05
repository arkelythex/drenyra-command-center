/**
 * Thread types (frontend)
 *
 * Mirrors the domain types for frontend consumption
 * while decoupling from backend shape.
 */

import type {
	AgentRole,
	TaskStatus,
	ThreadEnvironment,
	ThreadPriority,
	ThreadStatus,
} from "@drenyra/domain/entities/thread";

// ─── List / Summary ──────────────────────────────────────────────────────────

export interface ThreadSummary {
	id: string;
	companyId: string;
	title: string;
	status: ThreadStatus;
	environment: ThreadEnvironment;
	period?: string;
	priority: ThreadPriority;
	tags: string[];
	taskCount: number;
	completedTaskCount: number;
	agentCount: number;
	lastActivityAt: string;
	createdAt: string;
	updatedAt?: string;
}

// ─── Detail ──────────────────────────────────────────────────────────────────

export interface ThreadDetail extends ThreadSummary {
	description?: string;
	tasks: ThreadTask[];
	agents: ThreadAgentAssignment[];
	evidenceIds: string[];
	createdById?: string;
	closedAt?: string;
	closedById?: string;
	closeNote?: string;
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export interface ThreadTask {
	id: string;
	threadId?: string;
	title: string;
	description?: string;
	status: TaskStatus;
	agentId?: string;
	assignedAt?: string;
	completedAt?: string;
	completedById?: string;
	resultSummary?: string;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

// ─── Agent Assignments ───────────────────────────────────────────────────────

export interface ThreadAgentAssignment {
	agentId: string;
	agentName: string;
	role: AgentRole;
	assignedAt: string;
	isActive: boolean;
}

// ─── Quick Actions ───────────────────────────────────────────────────────────

export interface QuickAction {
	id: string;
	title: string;
	description: string;
	icon: string;
	template: QuickActionTemplate;
}

export interface QuickActionTemplate {
	title: string;
	priority: string;
	tags: string[];
	tasks: QuickActionTask[];
}

export interface QuickActionTask {
	title: string;
	order: number;
}

// ─── Payloads ────────────────────────────────────────────────────────────────

export interface CreateThreadPayload {
	companyId: string;
	title: string;
	description?: string;
	environment?: ThreadEnvironment;
	period?: string;
	priority?: ThreadPriority;
	tags?: string[];
	tasks: CreateTaskPayload[];
}

export interface CreateTaskPayload {
	title: string;
	description?: string;
	order?: number;
}

export interface UpdateThreadPayload {
	title?: string;
	description?: string;
	status?: string;
	priority?: ThreadPriority;
	environment?: ThreadEnvironment;
	tags?: string[];
	period?: string;
}

export interface AssignAgentPayload {
	agentId: string;
	agentName: string;
	role: AgentRole;
}

export interface CreateTaskInThreadPayload {
	title: string;
	description?: string;
	order?: number;
}

export interface UpdateTaskPayload {
	title?: string;
	description?: string;
	status?: TaskStatus;
	agentId?: string;
	resultSummary?: string;
	completedById?: string;
}

// ─── Filters / Query ─────────────────────────────────────────────────────────

export interface ThreadFilters {
	status?: string;
	period?: string;
	priority?: string;
	search?: string;
	limit?: number;
	offset?: number;
}

export interface PaginatedResult<T> {
	data: T[];
	total: number;
	limit: number;
	offset: number;
}
