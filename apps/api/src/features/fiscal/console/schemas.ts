import { z } from "zod";

const MetadataSchema = z.record(z.string(), z.unknown());

/**
 * CreateFiscalCaseSchema (Zod).
 */
export const CreateFiscalCaseSchema = z.object({
	type: z.union([
		z.literal("sire"),
		z.literal("cpe"),
		z.literal("sunat"),
		z.literal("audit"),
		z.literal("reconciliation"),
	]),
	priority: z
		.union([
			z.literal("low"),
			z.literal("medium"),
			z.literal("high"),
			z.literal("critical"),
		])
		.optional(),
	title: z.string().min(1),
	description: z.string().optional(),
	metadata: MetadataSchema.optional(),
});

/**
 * UpdateFiscalCaseSchema (Zod).
 */
export const UpdateFiscalCaseSchema = z
	.object({
		status: z
			.union([
				z.literal("open"),
				z.literal("in_review"),
				z.literal("blocked"),
				z.literal("resolved"),
				z.literal("closed"),
			])
			.optional(),
		priority: z
			.union([
				z.literal("low"),
				z.literal("medium"),
				z.literal("high"),
				z.literal("critical"),
			])
			.optional(),
		title: z.string().min(1).optional(),
		description: z.string().optional(),
		assignedAgentId: z.string().optional(),
		metadata: MetadataSchema.optional(),
	})
	.partial();

/**
 * RunAgentSchema (Zod).
 */
export const RunAgentSchema = z.object({
	caseId: z.string().optional(),
	agentType: z.string().min(1),
	metadata: MetadataSchema.optional(),
});

/**
 * CreateApprovalRequestSchema (Zod).
 */
export const CreateApprovalRequestSchema = z.object({
	caseId: z.string().optional(),
	requestType: z.union([
		z.literal("fiscal_change"),
		z.literal("credential_change"),
		z.literal("rollback"),
		z.literal("release"),
	]),
	priority: z
		.union([
			z.literal("low"),
			z.literal("medium"),
			z.literal("high"),
			z.literal("critical"),
		])
		.optional(),
	title: z.string().min(1),
	description: z.string().optional(),
	metadata: MetadataSchema.optional(),
});

/**
 * SubmitVoteSchema (Zod).
 */
export const SubmitVoteSchema = z.object({
	vote: z.boolean(),
	comment: z.string().optional(),
});

/**
 * RecordAuditEventSchema (Zod).
 */
export const RecordAuditEventSchema = z.object({
	eventType: z.string().min(1),
	entityType: z.string().min(1),
	entityId: z.string().min(1),
	action: z.string().min(1),
	changes: MetadataSchema.optional(),
	occurredAt: z.string().optional(),
});

// ─── TypeScript input types (preserved from original) ──────────────

export interface CreateFiscalCaseInput {
	type: "sire" | "cpe" | "sunat" | "audit" | "reconciliation";
	priority?: "low" | "medium" | "high" | "critical";
	title: string;
	description?: string;
	metadata?: Record<string, unknown>;
}

export interface UpdateFiscalCaseInput {
	status?: "open" | "in_review" | "blocked" | "resolved" | "closed";
	priority?: "low" | "medium" | "high" | "critical";
	title?: string;
	description?: string;
	assignedAgentId?: string;
	metadata?: Record<string, unknown>;
}

export interface RunAgentInput {
	caseId?: string;
	agentType: string;
	metadata?: Record<string, unknown>;
}

export interface CreateApprovalRequestInput {
	caseId?: string;
	requestType: "fiscal_change" | "credential_change" | "rollback" | "release";
	priority?: "low" | "medium" | "high" | "critical";
	title: string;
	description?: string;
	metadata?: Record<string, unknown>;
}

export interface SubmitVoteInput {
	vote: boolean;
	comment?: string;
}

export interface RecordAuditEventInput {
	eventType: string;
	entityType: string;
	entityId: string;
	action: string;
	changes?: Record<string, unknown>;
	occurredAt?: string;
}
