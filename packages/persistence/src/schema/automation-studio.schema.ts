import { relations } from "drizzle-orm";
import {
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { companies } from "./core.schema";

export const workflowStatusEnum = [
	"draft",
	"active",
	"paused",
	"error",
] as const;
export type WorkflowStatus = (typeof workflowStatusEnum)[number];

export const workflowCategoryEnum = [
	"alerts",
	"reconciliation",
	"reporting",
	"compliance",
	"notifications",
	"other",
] as const;
export type WorkflowCategory = (typeof workflowCategoryEnum)[number];

export const triggerTypeEnum = [
	"schedule",
	"event",
	"hook",
	"webhook",
] as const;
export type TriggerType = (typeof triggerTypeEnum)[number];

export const stepTypeEnum = ["condition", "action", "wait", "loop"] as const;
export type StepType = (typeof stepTypeEnum)[number];

export const actionTypeEnum = [
	"send_notification",
	"create_report",
	"post_journal",
	"check_sire",
	"update_evidence",
	"flag_for_review",
	"call_webhook",
] as const;
export type ActionType = (typeof actionTypeEnum)[number];

export const stepStatusEnum = ["active", "paused"] as const;
export type StepStatus = (typeof stepStatusEnum)[number];

export const executionStatusEnum = [
	"running",
	"success",
	"partial",
	"failed",
] as const;
export type ExecutionStatus = (typeof executionStatusEnum)[number];

export const lastRunStatusEnum = ["success", "error"] as const;
export type LastRunStatus = (typeof lastRunStatusEnum)[number];

export const automationWorkflows = pgTable(
	"automation_workflows",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id")
			.references(() => companies.id)
			.notNull(),

		name: varchar("name", { length: 255 }).notNull(),
		description: text("description"),
		category: varchar("category", { length: 20 })
			.$type<WorkflowCategory>()
			.default("other")
			.notNull(),

		triggerType: varchar("trigger_type", { length: 20 })
			.$type<TriggerType>()
			.notNull(),
		triggerConfig: jsonb("trigger_config")
			.$type<Record<string, unknown>>()
			.default({})
			.notNull(),

		status: varchar("status", { length: 10 })
			.$type<WorkflowStatus>()
			.default("draft")
			.notNull(),

		lastRunAt: timestamp("last_run_at"),
		lastRunStatus: varchar("last_run_status", {
			length: 10,
		}).$type<LastRunStatus>(),

		runCount: integer("run_count").default(0).notNull(),
		errorCount: integer("error_count").default(0).notNull(),

		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		companyIdx: index("automation_workflows_company_idx").on(table.companyId),
		statusIdx: index("automation_workflows_status_idx").on(table.status),
		categoryIdx: index("automation_workflows_category_idx").on(table.category),
		triggerTypeIdx: index("automation_workflows_trigger_type_idx").on(
			table.triggerType,
		),
	}),
);

export const automationSteps = pgTable(
	"automation_steps",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		workflowId: uuid("workflow_id")
			.references(() => automationWorkflows.id, { onDelete: "cascade" })
			.notNull(),

		stepOrder: integer("step_order").notNull(),
		stepType: varchar("step_type", { length: 12 }).$type<StepType>().notNull(),
		actionType: varchar("action_type", { length: 25 })
			.$type<ActionType>()
			.notNull(),
		config: jsonb("config")
			.$type<Record<string, unknown>>()
			.default({})
			.notNull(),

		status: varchar("status", { length: 10 })
			.$type<StepStatus>()
			.default("active")
			.notNull(),

		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		workflowIdx: index("automation_steps_workflow_idx").on(table.workflowId),
		workflowOrderIdx: index("automation_steps_workflow_order_idx").on(
			table.workflowId,
			table.stepOrder,
		),
	}),
);

export const automationExecutions = pgTable(
	"automation_executions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		workflowId: uuid("workflow_id")
			.references(() => automationWorkflows.id, { onDelete: "cascade" })
			.notNull(),
		stepId: uuid("step_id").references(() => automationSteps.id, {
			onDelete: "set null",
		}),

		triggeredBy: varchar("triggered_by", { length: 50 }).notNull(),
		status: varchar("status", { length: 10 })
			.$type<ExecutionStatus>()
			.default("running")
			.notNull(),

		startedAt: timestamp("started_at").defaultNow().notNull(),
		completedAt: timestamp("completed_at"),

		resultSummary: text("result_summary"),
		error: text("error"),
		log: text("log"),
	},
	(table) => ({
		workflowIdx: index("automation_executions_workflow_idx").on(
			table.workflowId,
		),
		statusIdx: index("automation_executions_status_idx").on(table.status),
		startedAtIdx: index("automation_executions_started_at_idx").on(
			table.startedAt,
		),
	}),
);

export const automationWorkflowsRelations = relations(
	automationWorkflows,
	({ one, many }) => ({
		company: one(companies, {
			fields: [automationWorkflows.companyId],
			references: [companies.id],
		}),
		steps: many(automationSteps),
		executions: many(automationExecutions),
	}),
);

export const automationStepsRelations = relations(
	automationSteps,
	({ one }) => ({
		workflow: one(automationWorkflows, {
			fields: [automationSteps.workflowId],
			references: [automationWorkflows.id],
		}),
	}),
);

export const automationExecutionsRelations = relations(
	automationExecutions,
	({ one }) => ({
		workflow: one(automationWorkflows, {
			fields: [automationExecutions.workflowId],
			references: [automationWorkflows.id],
		}),
		step: one(automationSteps, {
			fields: [automationExecutions.stepId],
			references: [automationSteps.id],
		}),
	}),
);
