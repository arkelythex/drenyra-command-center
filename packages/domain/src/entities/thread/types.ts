export type ThreadStatus =
	| "DRAFT"
	| "ACTIVE"
	| "BLOCKED"
	| "PENDING_REVIEW"
	| "AWAITING_INFO"
	| "REVIEWED"
	| "CLOSED";

export type TaskStatus =
	| "PENDING"
	| "ASSIGNED"
	| "IN_PROGRESS"
	| "COMPLETED"
	| "FAILED"
	| "SKIPPED";

export type ThreadEnvironment = "local" | "sandbox" | "cloud";

export type ThreadPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type AgentRole = "PRIMARY" | "SUPPORT" | "REVIEWER" | "OBSERVER";

export interface ThreadTaskProps {
	id: string;
	title: string;
	description?: string;
	status: TaskStatus;
	agentId?: string;
	assignedAt?: Date;
	completedAt?: Date;
	completedById?: string;
	resultSummary?: string;
	evidenceIds: string[];
	order: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface ThreadAgentAssignmentProps {
	threadId: string;
	agentId: string;
	agentName: string;
	role: AgentRole;
	assignedAt: Date;
	unassignedAt?: Date;
	isActive: boolean;
}

export interface ThreadProps {
	id: string;
	companyId: string;
	title: string;
	description?: string;
	status: ThreadStatus;
	environment: ThreadEnvironment;
	period?: string;
	priority: ThreadPriority;
	tags: string[];
	tasks: ThreadTaskProps[];
	agentAssignments: ThreadAgentAssignmentProps[];
	evidenceIds: string[];
	createdById: string;
	createdAt: Date;
	updatedAt: Date;
	closedAt?: Date;
	closedById?: string;
	closeNote?: string;
}
