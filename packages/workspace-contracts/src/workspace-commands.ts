import { z } from "zod";

// ─── Workspace Commands ────────────────────────────────────────────────────

export const CreateWorkspaceCommandSchema = z.object({
	commandType: z.literal("create-workspace"),
	organizationId: z.string().min(1),
	companyIds: z.array(z.string().min(1)).min(1),
	fiscalPeriodIds: z.array(z.string().min(1)).min(1),
	objective: z.union([
		z.object({
			kind: z.literal("monthly-close"),
			fiscalPeriodId: z.string().min(1),
		}),
		z.object({
			kind: z.literal("sire-review"),
			fiscalPeriodId: z.string().min(1),
			recordType: z.enum(["RCE", "RVIE"]),
		}),
		z.object({
			kind: z.literal("tax-audit"),
			fiscalPeriodId: z.string().min(1),
		}),
		z.object({
			kind: z.literal("bank-reconciliation"),
			accountIds: z.array(z.string().min(1)).min(1),
		}),
		z.object({
			kind: z.literal("rce-rectification"),
			fiscalPeriodId: z.string().min(1),
		}),
		z.object({ kind: z.literal("portfolio-operations") }),
		z.object({
			kind: z.literal("evidence-audit"),
			fiscalPeriodId: z.string().min(1),
		}),
		z.object({ kind: z.literal("custom"), definitionId: z.string().min(1) }),
	]),
	layoutId: z.string().nullable().default(null),
	timestamp: z.string().optional(),
});

export type CreateWorkspaceCommand = z.infer<
	typeof CreateWorkspaceCommandSchema
>;

export const AddCompanyCommandSchema = z.object({
	commandType: z.literal("add-company"),
	workspaceId: z.string().min(1),
	companyId: z.string().min(1),
	timestamp: z.string().optional(),
});

export type AddCompanyCommand = z.infer<typeof AddCompanyCommandSchema>;

export const ChangeObjectiveCommandSchema = z.object({
	commandType: z.literal("change-objective"),
	workspaceId: z.string().min(1),
	objective: CreateWorkspaceCommandSchema.shape.objective,
	timestamp: z.string().optional(),
});

export type ChangeObjectiveCommand = z.infer<
	typeof ChangeObjectiveCommandSchema
>;

// ─── View commands ─────────────────────────────────────────────────────────

export const CreateViewCommandSchema = z.object({
	commandType: z.literal("create-view"),
	workspaceId: z.string().min(1),
	kind: z.enum([
		"ledger",
		"evidence",
		"sire-comparison",
		"agent-activity",
		"financial-diff",
		"approval",
		"document-viewer",
		"close-readiness",
	]),
	label: z.string().min(1),
	placement: z.object({
		row: z.number().int().min(0),
		column: z.number().int().min(0),
		width: z.number().positive(),
		height: z.number().positive(),
	}),
	query: z.record(z.string(), z.unknown()).default({}),
	timestamp: z.string().optional(),
});

export type CreateViewCommand = z.infer<typeof CreateViewCommandSchema>;

export const MoveViewCommandSchema = z.object({
	commandType: z.literal("move-view"),
	viewId: z.string().min(1),
	placement: CreateViewCommandSchema.shape.placement,
	timestamp: z.string().optional(),
});

export type MoveViewCommand = z.infer<typeof MoveViewCommandSchema>;

// ─── Execution commands ────────────────────────────────────────────────────

export const AttachToExecutionCommandSchema = z.object({
	commandType: z.literal("attach-to-execution"),
	executionId: z.string().min(1),
	fromSequence: z.number().int().nonnegative().optional(),
	clientId: z.string().optional(),
	timestamp: z.string().optional(),
});

export type AttachToExecutionCommand = z.infer<
	typeof AttachToExecutionCommandSchema
>;

export const DetachFromExecutionCommandSchema = z.object({
	commandType: z.literal("detach-from-execution"),
	executionId: z.string().min(1),
	clientId: z.string().optional(),
	reason: z.string().optional(),
	timestamp: z.string().optional(),
});

export type DetachFromExecutionCommand = z.infer<
	typeof DetachFromExecutionCommandSchema
>;

export const ResumeWorkspaceCommandSchema = z.object({
	commandType: z.literal("resume-workspace"),
	workspaceId: z.string().min(1),
	executionIds: z.array(z.string().min(1)).min(1),
	timestamp: z.string().optional(),
});

export type ResumeWorkspaceCommand = z.infer<
	typeof ResumeWorkspaceCommandSchema
>;

// ─── Layout commands ───────────────────────────────────────────────────────

export const ApplyLayoutCommandSchema = z.object({
	commandType: z.literal("apply-layout"),
	workspaceId: z.string().min(1),
	template: z.enum([
		"portfolio-operations",
		"monthly-close",
		"sire-review",
		"bank-reconciliation",
		"evidence-audit",
	]),
	timestamp: z.string().optional(),
});

export type ApplyLayoutCommand = z.infer<typeof ApplyLayoutCommandSchema>;

// ─── Union of all commands ─────────────────────────────────────────────────

export const WorkspaceCommandSchema = z.discriminatedUnion("commandType", [
	CreateWorkspaceCommandSchema,
	AddCompanyCommandSchema,
	ChangeObjectiveCommandSchema,
	CreateViewCommandSchema,
	MoveViewCommandSchema,
	AttachToExecutionCommandSchema,
	DetachFromExecutionCommandSchema,
	ResumeWorkspaceCommandSchema,
	ApplyLayoutCommandSchema,
]);

export type WorkspaceCommand = z.infer<typeof WorkspaceCommandSchema>;

// ─── Command Envelope ──────────────────────────────────────────────────────

export const CommandEnvelopeSchema = z.object({
	command: WorkspaceCommandSchema,
	correlationId: z.string().optional(),
	userId: z.string().optional(),
	clientId: z.string().optional(),
	idempotencyKey: z.string().optional(),
});

export type CommandEnvelope = z.infer<typeof CommandEnvelopeSchema>;
