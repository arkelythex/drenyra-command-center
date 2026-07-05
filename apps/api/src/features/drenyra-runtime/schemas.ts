import { z } from "zod";

const DRENYRA_RUC_REGEX = /^\d{11}$/;
const DRENYRA_PERIOD_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

const DRENYRA_THREAD_STATUSES = [
	"active",
	"archived",
	"completed",
	"failed",
] as const;

const DRENYRA_RUN_STATUSES = [
	"queued",
	"running",
	"waiting_for_approval",
	"completed",
	"failed",
	"cancelled",
] as const;

const DRENYRA_RUN_SOURCES = ["cli", "react", "api", "workflow"] as const;

const DRENYRA_RUN_EVENT_TYPES = [
	"run.created",
	"agent.started",
	"agent.node.completed",
	"evidence.attached",
	"approval.required",
	"approval.resolved",
	"workflow.completed",
	"workflow.failed",
] as const;

const DRENYRA_APPROVAL_STATUSES = [
	"pending",
	"approved",
	"rejected",
	"expired",
] as const;

const DRENYRA_RISK_LEVELS = ["low", "medium", "high", "critical"] as const;

const DRENYRA_ITEM_TYPES = [
	"message",
	"command",
	"approval",
	"evidence",
	"run",
	"output",
	"web_search",
	"tool_call",
] as const;

const drenyraMetadataSchema = z.record(z.string(), z.unknown()).default({});
const drenyraRefsSchema = z.array(z.string().min(1)).default([]);

export const drenyraThreadStatusSchema = z.enum(DRENYRA_THREAD_STATUSES);
export const DrenyraThreadStatusSchema = drenyraThreadStatusSchema;

export const drenyraThreadSchema = z.object({
	threadId: z.string().min(1),
	tenantId: z.string().min(1),
	title: z.string().min(1),
	status: drenyraThreadStatusSchema,
	companyId: z.string().min(1).optional(),
	ruc: z.string().regex(DRENYRA_RUC_REGEX).optional(),
	period: z.string().regex(DRENYRA_PERIOD_REGEX).optional(),
	traceId: z.string().min(1).optional(),
	metadata: drenyraMetadataSchema,
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});
export const DrenyraThreadSchema = drenyraThreadSchema;

export const createDrenyraThreadRequestSchema = z.object({
	tenantId: z.string().min(1),
	title: z.string().min(1),
	companyId: z.string().min(1).optional(),
	ruc: z.string().regex(DRENYRA_RUC_REGEX).optional(),
	period: z.string().regex(DRENYRA_PERIOD_REGEX).optional(),
	initialObjective: z.string().min(1).optional(),
});
export const CreateDrenyraThreadRequestSchema =
	createDrenyraThreadRequestSchema;

export const drenyraRunStatusSchema = z.enum(DRENYRA_RUN_STATUSES);
export const DrenyraRunStatusSchema = drenyraRunStatusSchema;

export const drenyraRunSourceSchema = z.enum(DRENYRA_RUN_SOURCES);
export const DrenyraRunSourceSchema = drenyraRunSourceSchema;

export const drenyraRunSchema = z.object({
	runId: z.string().min(1),
	source: drenyraRunSourceSchema,
	status: drenyraRunStatusSchema,
	tenantId: z.string().min(1),
	companyId: z.string().min(1).optional(),
	ruc: z.string().regex(DRENYRA_RUC_REGEX).optional(),
	period: z.string().regex(DRENYRA_PERIOD_REGEX).optional(),
	objective: z.string().min(1),
	approvalIds: drenyraRefsSchema,
	evidenceRefs: drenyraRefsSchema,
	traceId: z.string().min(1).optional(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});
export const DrenyraRunSchema = drenyraRunSchema;

export const drenyraTurnSchema = z.object({
	turnId: z.string().min(1),
	threadId: z.string().min(1),
	source: drenyraRunSourceSchema,
	instruction: z.string().min(1),
	createdAt: z.iso.datetime(),
	actorId: z.string().min(1).optional(),
	metadata: drenyraMetadataSchema,
});
export const DrenyraTurnSchema = drenyraTurnSchema;

export const createDrenyraTurnRequestSchema = z.object({
	threadId: z.string().min(1),
	source: drenyraRunSourceSchema,
	instruction: z.string().min(1),
	actorId: z.string().min(1).optional(),
});
export const CreateDrenyraTurnRequestSchema = createDrenyraTurnRequestSchema;

export const drenyraItemTypeSchema = z.enum(DRENYRA_ITEM_TYPES);
export const DrenyraItemTypeSchema = drenyraItemTypeSchema;

export const drenyraItemSchema = z.object({
	itemId: z.string().min(1),
	threadId: z.string().min(1),
	turnId: z.string().min(1).optional(),
	type: drenyraItemTypeSchema,
	sequence: z.number().int().nonnegative(),
	createdAt: z.iso.datetime(),
	payload: drenyraMetadataSchema,
});
export const DrenyraItemSchema = drenyraItemSchema;

export const drenyraWebSearchAuditSchema = z.object({
	searchId: z.string().min(1),
	threadId: z.string().min(1),
	turnId: z.string().min(1).optional(),
	query: z.string().min(1),
	source: z.string().min(1),
	searchedAt: z.iso.datetime(),
	snippets: z.array(z.string().min(1)).default([]),
	citations: z.array(z.string().min(1)).default([]),
	tenantId: z.string().min(1).optional(),
	companyId: z.string().min(1).optional(),
	ruc: z.string().regex(DRENYRA_RUC_REGEX).optional(),
	period: z.string().regex(DRENYRA_PERIOD_REGEX).optional(),
	scope: z.string().min(1).optional(),
});
export const DrenyraWebSearchAuditSchema = drenyraWebSearchAuditSchema;

export const drenyraRunEventTypeSchema = z.enum(DRENYRA_RUN_EVENT_TYPES);
export const DrenyraRunEventTypeSchema = drenyraRunEventTypeSchema;

export const drenyraRunEventSchema = z.object({
	eventId: z.string().min(1),
	runId: z.string().min(1),
	type: drenyraRunEventTypeSchema,
	sequence: z.number().int().nonnegative(),
	occurredAt: z.iso.datetime(),
	payload: z.record(z.string(), z.unknown()).default({}),
});
export const DrenyraRunEventSchema = drenyraRunEventSchema;

const drenyraApprovalBaseSchema = z.object({
	approvalId: z.string().min(1),
	runId: z.string().min(1),
	status: z.enum(DRENYRA_APPROVAL_STATUSES),
	requestedAction: z.string().min(1),
	riskLevel: z.enum(DRENYRA_RISK_LEVELS),
	evidenceRefs: drenyraRefsSchema,
	decidedAt: z.iso.datetime().optional(),
	decidedBy: z.string().min(1).optional(),
	reason: z.string().min(1).optional(),
});

type DrenyraApprovalDraft = z.infer<typeof drenyraApprovalBaseSchema>;

export const drenyraApprovalSchema = drenyraApprovalBaseSchema.superRefine(
	(approval: DrenyraApprovalDraft, ctx: z.RefinementCtx) => {
		if (approval.status === "pending") {
			if (approval.decidedBy !== undefined) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["decidedBy"],
					message: "decidedBy must be absent when status is pending",
				});
			}

			if (approval.decidedAt !== undefined) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["decidedAt"],
					message: "decidedAt must be absent when status is pending",
				});
			}

			if (approval.reason !== undefined) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["reason"],
					message: "reason must be absent when status is pending",
				});
			}
		}

		if (approval.status === "approved" || approval.status === "rejected") {
			if (!approval.decidedBy) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["decidedBy"],
					message: "decidedBy is required when status is approved or rejected",
				});
			}

			if (!approval.decidedAt) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["decidedAt"],
					message: "decidedAt is required when status is approved or rejected",
				});
			}
		}

		if (approval.status === "rejected" && !approval.reason) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["reason"],
				message: "reason is required when status is rejected",
			});
		}

		if (approval.status === "expired" && !approval.decidedAt) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["decidedAt"],
				message: "decidedAt is required when status is expired",
			});
		}
	},
);
export const DrenyraApprovalSchema = drenyraApprovalSchema;

export const createDrenyraRunRequestSchema = z.object({
	source: drenyraRunSourceSchema,
	tenantId: z.string().min(1),
	companyId: z.string().min(1).optional(),
	ruc: z.string().regex(DRENYRA_RUC_REGEX).optional(),
	period: z.string().regex(DRENYRA_PERIOD_REGEX).optional(),
	workflowId: z.string().min(1).optional(),
	objective: z.string().min(1),
});
export const CreateDrenyraRunRequestSchema = createDrenyraRunRequestSchema;

export type DrenyraThread = z.infer<typeof drenyraThreadSchema>;
export type CreateDrenyraThreadRequest = z.infer<
	typeof createDrenyraThreadRequestSchema
>;
export type DrenyraRun = z.infer<typeof drenyraRunSchema>;
export type DrenyraTurn = z.infer<typeof drenyraTurnSchema>;
export type CreateDrenyraTurnRequest = z.infer<
	typeof createDrenyraTurnRequestSchema
>;
export type DrenyraItem = z.infer<typeof drenyraItemSchema>;
export type DrenyraRunEvent = z.infer<typeof drenyraRunEventSchema>;
export type DrenyraApproval = z.infer<typeof drenyraApprovalSchema>;
export type CreateDrenyraRunRequest = z.infer<
	typeof createDrenyraRunRequestSchema
>;
export type DrenyraWebSearchAudit = z.infer<typeof drenyraWebSearchAuditSchema>;
