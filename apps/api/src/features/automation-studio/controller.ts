import { and, desc, eq, sql } from "@drenyra/persistence/query";
import type {
	ActionType,
	StepStatus,
	StepType,
	TriggerType,
	WorkflowCategory,
} from "@drenyra/persistence/schema/automation-studio.schema";
import {
	automationExecutions,
	automationSteps,
	automationWorkflows,
} from "@drenyra/persistence/schema/automation-studio.schema";
import { db } from "../../lib/db";
import type {
	CreateStepBody,
	CreateWorkflowBody,
	DashboardStatsResponse,
	ExecutionResponse,
	ReorderStepsBody,
	StepResponse,
	UpdateStepBody,
	UpdateWorkflowBody,
	WorkflowResponse,
} from "./types";

const SEVEN_DAYS_AGO = () =>
	new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

// --- Workflows ---

export async function listWorkflows(
	companyId: string,
	status?: string,
	category?: string,
): Promise<{ data: WorkflowResponse[]; total: number }> {
	const conditions = [eq(automationWorkflows.companyId, companyId)];
	if (status)
		conditions.push(
			eq(
				automationWorkflows.status,
				status as (typeof automationWorkflows.$inferSelect)["status"],
			),
		);
	if (category)
		conditions.push(
			eq(
				automationWorkflows.category,
				category as (typeof automationWorkflows.$inferSelect)["category"],
			),
		);

	const rows = await db
		.select()
		.from(automationWorkflows)
		.where(and(...conditions))
		.orderBy(desc(automationWorkflows.updatedAt));

	const data = await Promise.all(rows.map((r) => enrichWorkflowWithSteps(r)));
	return { data, total: data.length };
}

export async function getWorkflow(
	id: string,
): Promise<WorkflowResponse | null> {
	const row = await db
		.select()
		.from(automationWorkflows)
		.where(eq(automationWorkflows.id, id))
		.limit(1);

	if (row.length === 0) return null;
	const first = row[0];
	if (!first) return null;
	return enrichWorkflowWithSteps(first);
}

export async function createWorkflow(
	companyId: string,
	body: CreateWorkflowBody,
): Promise<WorkflowResponse> {
	const [row] = await db
		.insert(automationWorkflows)
		.values({
			companyId,
			name: body.name,
			description: body.description ?? null,
			category: body.category as WorkflowCategory,
			triggerType: body.triggerType as TriggerType,
			triggerConfig: body.triggerConfig,
		})
		.returning();

	if (!row) throw new Error("Failed to create workflow");
	return enrichWorkflowWithSteps(row);
}

export async function updateWorkflow(
	id: string,
	body: UpdateWorkflowBody,
): Promise<WorkflowResponse | null> {
	const [row] = await db
		.update(automationWorkflows)
		.set({
			name: body.name,
			description: body.description,
			category: body.category as WorkflowCategory,
			triggerType: body.triggerType as TriggerType,
			triggerConfig: body.triggerConfig,
			updatedAt: new Date().toISOString() as unknown as Date,
		})
		.where(eq(automationWorkflows.id, id))
		.returning();

	if (!row) return null;
	return enrichWorkflowWithSteps(row);
}

export async function deleteWorkflow(id: string): Promise<boolean> {
	const [row] = await db
		.delete(automationWorkflows)
		.where(eq(automationWorkflows.id, id))
		.returning({ id: automationWorkflows.id });

	return !!row;
}

export async function activateWorkflow(
	id: string,
): Promise<WorkflowResponse | null> {
	const [row] = await db
		.update(automationWorkflows)
		.set({
			status: "active",
			updatedAt: new Date().toISOString() as unknown as Date,
		})
		.where(eq(automationWorkflows.id, id))
		.returning();

	if (!row) return null;
	return enrichWorkflowWithSteps(row);
}

export async function pauseWorkflow(
	id: string,
): Promise<WorkflowResponse | null> {
	const [row] = await db
		.update(automationWorkflows)
		.set({
			status: "paused",
			updatedAt: new Date().toISOString() as unknown as Date,
		})
		.where(eq(automationWorkflows.id, id))
		.returning();

	if (!row) return null;
	return enrichWorkflowWithSteps(row);
}

export async function duplicateWorkflow(
	companyId: string,
	id: string,
): Promise<WorkflowResponse | null> {
	const original = await db
		.select()
		.from(automationWorkflows)
		.where(eq(automationWorkflows.id, id))
		.limit(1);

	if (original.length === 0) return null;

	const src = original[0];
	if (!src) return null;

	const [newWf] = await db
		.insert(automationWorkflows)
		.values({
			companyId,
			name: `${src.name} (copia)`,
			description: src.description,
			category: src.category,
			triggerType: src.triggerType,
			triggerConfig: src.triggerConfig,
		})
		.returning();
	if (!newWf) throw new Error("Failed to create workflow");

	const steps = await db
		.select()
		.from(automationSteps)
		.where(eq(automationSteps.workflowId, id))
		.orderBy(automationSteps.stepOrder);

	if (steps.length > 0) {
		await db.insert(automationSteps).values(
			steps.map((s) => ({
				workflowId: newWf.id,
				stepOrder: s.stepOrder,
				stepType: s.stepType,
				actionType: s.actionType,
				config: s.config,
				status: s.status,
			})),
		);
	}

	return getWorkflow(newWf.id);
}

export async function testWorkflow(
	id: string,
): Promise<{ executionId: string }> {
	const wf = await getWorkflow(id);
	if (!wf) throw new Error("Workflow not found");

	const [exec] = await db
		.insert(automationExecutions)
		.values({
			workflowId: id,
			triggeredBy: "test",
			status: "running",
			log: `[${new Date().toISOString()}] Test run started for workflow "${wf.name}"\n`,
		})
		.returning();
	if (!exec) throw new Error("Failed to create execution");

	const logLines: string[] = [];
	logLines.push(
		`[${new Date().toISOString()}] Executing ${(wf.steps ?? []).length} steps...`,
	);

	let execStatus: "running" | "success" | "partial" | "failed" = "success";

	for (const step of wf.steps ?? []) {
		logLines.push(
			`[${new Date().toISOString()}] Step ${step.stepOrder}: ${step.actionType} (${step.stepType})`,
		);

		await db
			.update(automationExecutions)
			.set({ stepId: step.id })
			.where(eq(automationExecutions.id, exec.id));

		try {
			const result = await executeAction(step.actionType as ActionType, step.config);
			if (result.ok) {
				logLines.push(`[${new Date().toISOString()}]   ✓ ${result.message}`);
			} else {
				logLines.push(`[${new Date().toISOString()}]   ⚠ ${result.message}`);
				execStatus = "partial";
			}
		} catch (err) {
			logLines.push(
				`[${new Date().toISOString()}]   ✗ Error: ${err instanceof Error ? err.message : String(err)}`,
			);
			execStatus = "failed";
			break;
		}
	}

	const completedAt = new Date().toISOString();
	logLines.push(`[${completedAt}] Test run ${execStatus}`);

	await db
		.update(automationExecutions)
		.set({
			status: execStatus,
			completedAt: completedAt as unknown as Date,
			log: logLines.join("\n"),
			resultSummary:
				execStatus === "success"
					? `Todos los ${(wf.steps ?? []).length} pasos completados exitosamente`
					: `Completado con estado: ${execStatus}`,
		})
		.where(eq(automationExecutions.id, exec.id));

	return { executionId: exec.id };
}

// --- Steps ---

export async function listSteps(
	workflowId: string,
): Promise<{ data: StepResponse[] }> {
	const rows = await db
		.select()
		.from(automationSteps)
		.where(eq(automationSteps.workflowId, workflowId))
		.orderBy(automationSteps.stepOrder);

	return { data: rows.map(mapStep) };
}

export async function getStep(id: string): Promise<StepResponse | null> {
	const [row] = await db
		.select()
		.from(automationSteps)
		.where(eq(automationSteps.id, id))
		.limit(1);

	return row ? mapStep(row) : null;
}

export async function createStep(
	body: CreateStepBody,
): Promise<StepResponse | null> {
	const [row] = await db
		.insert(automationSteps)
		.values({
			workflowId: body.workflowId,
			stepOrder: body.stepOrder,
			stepType: body.stepType as StepType,
			actionType: body.actionType as ActionType,
			config: body.config,
		})
		.returning();

	return row ? mapStep(row) : null;
}

export async function updateStep(
	id: string,
	body: UpdateStepBody,
): Promise<StepResponse | null> {
	const [row] = await db
		.update(automationSteps)
		.set({
			stepOrder: body.stepOrder,
			stepType: body.stepType as StepType,
			actionType: body.actionType as ActionType,
			config: body.config,
			status: body.status as StepStatus,
		})
		.where(eq(automationSteps.id, id))
		.returning();

	return row ? mapStep(row) : null;
}

export async function deleteStep(id: string): Promise<boolean> {
	const [row] = await db
		.delete(automationSteps)
		.where(eq(automationSteps.id, id))
		.returning({ id: automationSteps.id });

	return !!row;
}

export async function reorderSteps(
	body: ReorderStepsBody,
): Promise<StepResponse[]> {
	const rows: StepResponse[] = [];

	for (let i = 0; i < body.stepIds.length; i++) {
		const stepId = body.stepIds[i];
		if (!stepId) continue;
		const [row] = await db
			.update(automationSteps)
			.set({ stepOrder: i })
			.where(
				and(
					eq(automationSteps.id, stepId),
					eq(automationSteps.workflowId, body.workflowId),
				),
			)
			.returning();

		if (row) rows.push(mapStep(row));
	}

	return rows.sort((a, b) => a.stepOrder - b.stepOrder);
}

// --- Executions ---

export async function listExecutions(
	workflowId: string,
): Promise<{ data: ExecutionResponse[] }> {
	const rows = await db
		.select()
		.from(automationExecutions)
		.where(eq(automationExecutions.workflowId, workflowId))
		.orderBy(desc(automationExecutions.startedAt));

	return { data: rows.map(mapExecution) };
}

export async function getExecution(
	id: string,
): Promise<ExecutionResponse | null> {
	const [row] = await db
		.select()
		.from(automationExecutions)
		.where(eq(automationExecutions.id, id))
		.limit(1);

	return row ? mapExecution(row) : null;
}

// --- Dashboard ---

export async function getDashboardStats(
	companyId: string,
): Promise<DashboardStatsResponse> {
	const [activeCount] = await db
		.select({ count: sql<number>`count(*)` })
		.from(automationWorkflows)
		.where(
			and(
				eq(automationWorkflows.companyId, companyId),
				eq(automationWorkflows.status, "active"),
			),
		);

	const [totalRuns] = await db
		.select({ count: sql<number>`coalesce(sum(run_count), 0)` })
		.from(automationWorkflows)
		.where(eq(automationWorkflows.companyId, companyId));

	const [successRows] = await db
		.select({ count: sql<number>`count(*)` })
		.from(automationExecutions)
		.where(
			and(
				eq(automationExecutions.status, "success"),
				sql`workflow_id IN (SELECT id FROM automation_workflows WHERE company_id = ${companyId})`,
			),
		);

	const [totalExecRows] = await db
		.select({ count: sql<number>`count(*)` })
		.from(automationExecutions)
		.where(
			sql`workflow_id IN (SELECT id FROM automation_workflows WHERE company_id = ${companyId})`,
		);

	const totalExecs = Number(totalExecRows?.count ?? 0);
	const successRate =
		totalExecs > 0
			? Math.round((Number(successRows?.count ?? 0) / totalExecs) * 100)
			: 0;

	const recent = await db
		.select()
		.from(automationExecutions)
		.where(
			sql`workflow_id IN (SELECT id FROM automation_workflows WHERE company_id = ${companyId})`,
		)
		.orderBy(desc(automationExecutions.startedAt))
		.limit(5);

	const catRows = await db
		.select({
			category: automationWorkflows.category,
			count: sql<number>`count(*)`,
		})
		.from(automationWorkflows)
		.where(eq(automationWorkflows.companyId, companyId))
		.groupBy(automationWorkflows.category);

	const workflowsByCategory: Record<string, number> = {};
	for (const r of catRows) {
		workflowsByCategory[r.category] = Number(r.count);
	}

	// count rows by category below
	const weekAgo = SEVEN_DAYS_AGO();
	// day rows computed below
	const dayRows = await db
		.select({
			date: sql<string>`DATE(started_at)`,
			count: sql<number>`count(*)`,
		})
		.from(automationExecutions)
		.where(
			and(
				sql`started_at >= ${weekAgo}::timestamp`,
				sql`workflow_id IN (SELECT id FROM automation_workflows WHERE company_id = ${companyId})`,
			),
		)
		.groupBy(sql`DATE(started_at)`)
		.orderBy(sql`DATE(started_at)`);

	return {
		activeWorkflows: Number(activeCount?.count ?? 0),
		totalRuns: Number(totalRuns?.count ?? 0),
		successRate,
		recentExecutions: recent.map(mapExecution),
		workflowsByCategory,
		runsByDay: dayRows.map((r) => ({
			date: r.date,
			count: Number(r.count),
		})),
	};
}

// --- Internal helpers ---

async function executeAction(
	actionType: ActionType,
	_config: Record<string, unknown>,
): Promise<{ ok: boolean; message: string }> {
	switch (actionType) {
		case "send_notification":
			return { ok: true, message: "Notificación enviada (simulado)" };
		case "create_report":
			return { ok: true, message: "Reporte generado (simulado)" };
		case "post_journal":
			return {
				ok: false,
				message: "post_journal requiere implementación del motor contable",
			};
		case "check_sire":
			return {
				ok: false,
				message: "check_sire requiere integración con módulo SIRE",
			};
		case "update_evidence":
			return { ok: true, message: "Evidencia actualizada (simulado)" };
		case "flag_for_review":
			return { ok: true, message: "Tarea de revisión creada (simulado)" };
		case "call_webhook":
			return {
				ok: false,
				message: "call_webhook requiere configuración de webhook",
			};
		case "execute_skill":
			return {
				ok: true,
				message: "Ejecución de skill iniciada (simulado)",
			};
		default:
			return actionType satisfies never;
	}
}

async function enrichWorkflowWithSteps(
	row: typeof automationWorkflows.$inferSelect,
): Promise<WorkflowResponse> {
	const steps = await db
		.select()
		.from(automationSteps)
		.where(eq(automationSteps.workflowId, row.id))
		.orderBy(automationSteps.stepOrder);

	return {
		...mapWorkflow(row),
		steps: steps.map(mapStep),
	};
}

function mapWorkflow(
	row: typeof automationWorkflows.$inferSelect,
): WorkflowResponse {
	return {
		id: row.id,
		companyId: row.companyId,
		name: row.name,
		...(row.description ? { description: row.description } : {}),
		category: row.category,
		triggerType: row.triggerType,
		triggerConfig: row.triggerConfig,
		status: row.status,
		...(row.lastRunAt ? { lastRunAt: row.lastRunAt.toISOString() } : {}),
		...(row.lastRunStatus ? { lastRunStatus: row.lastRunStatus } : {}),
		runCount: row.runCount,
		errorCount: row.errorCount,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

function mapStep(row: typeof automationSteps.$inferSelect): StepResponse {
	return {
		id: row.id,
		workflowId: row.workflowId,
		stepOrder: row.stepOrder,
		stepType: row.stepType,
		actionType: row.actionType,
		config: row.config,
		status: row.status,
		createdAt: row.createdAt.toISOString(),
	};
}

function mapExecution(
	row: typeof automationExecutions.$inferSelect,
): ExecutionResponse {
	return {
		id: row.id,
		workflowId: row.workflowId,
		...(row.stepId ? { stepId: row.stepId } : {}),
		triggeredBy: row.triggeredBy,
		status: row.status,
		startedAt: row.startedAt.toISOString(),
		...(row.completedAt ? { completedAt: row.completedAt.toISOString() } : {}),
		...(row.resultSummary ? { resultSummary: row.resultSummary } : {}),
		...(row.error ? { error: row.error } : {}),
		...(row.log ? { log: row.log } : {}),
	};
}
