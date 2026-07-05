import { and, desc, eq, inArray } from "@drenyra/persistence/query";
import {
	automationWorkflows,
	automationSteps,
	automationExecutions,
} from "@drenyra/persistence/schema/automation-studio.schema";
import { skills } from "@drenyra/persistence/schema";
import { db } from "../../lib/db";

export interface AutomationDTO {
	id: string;
	companyId: string;
	name: string;
	description?: string;
	triggerType: string;
	triggerConfig: Record<string, unknown>;
	status: string;
	skills: Array<{ id: string; name: string }>;
	autonomy: string;
	lastRunAt?: string;
	lastRunStatus?: string;
	runCount: number;
}

export interface AutomationLogEntry {
	id: string;
	automationId: string;
	status: string;
	startedAt: string;
	completedAt?: string;
	resultSummary?: string;
	error?: string;
}

// ─── WORKFLOW ≅ AUTOMATION ───

export async function listCompanyAutomations(
	companyId: string,
	status?: string,
): Promise<AutomationDTO[]> {
	const conditions = [eq(automationWorkflows.companyId, companyId)];
	if (status) {
		conditions.push(eq(automationWorkflows.status, status as any));
	}

	const workflows = await db
		.select()
		.from(automationWorkflows)
		.where(and(...conditions))
		.orderBy(desc(automationWorkflows.createdAt));

	const results: AutomationDTO[] = [];

	for (const wf of workflows) {
		// Get skills associated via steps
		const steps = await db
			.select()
			.from(automationSteps)
			.where(eq(automationSteps.workflowId, wf.id));

		const skillIds = steps
			.filter(
				(s) =>
					(s.config as Record<string, unknown>)?.skillId &&
					typeof (s.config as Record<string, unknown>).skillId === "string",
			)
			.map((s) => (s.config as Record<string, unknown>).skillId as string);

		const skillNames: Array<{ id: string; name: string }> = [];
		if (skillIds.length > 0) {
			const skillRows = await db
				.select({ id: skills.id, name: skills.name })
				.from(skills)
				.where(inArray(skills.id, skillIds));
			skillNames.push(...skillRows);
		}

		// Count executions
		const executions = await db
			.select({ id: automationExecutions.id })
			.from(automationExecutions)
			.where(eq(automationExecutions.workflowId, wf.id));

		// Last execution
		const [lastExec] = await db
			.select()
			.from(automationExecutions)
			.where(eq(automationExecutions.workflowId, wf.id))
			.orderBy(desc(automationExecutions.startedAt))
			.limit(1);

		results.push({
			id: wf.id,
			companyId: wf.companyId,
			name: wf.name,
			description: wf.description ?? undefined,
			triggerType: wf.triggerType,
			triggerConfig: wf.triggerConfig as Record<string, unknown>,
			status: wf.status,
			skills: skillNames,
			autonomy: ((wf as any).metadata as Record<string, unknown>)?.autonomy as string ?? "suggest",
			lastRunAt: lastExec?.completedAt?.toISOString() ?? lastExec?.startedAt?.toISOString(),
			lastRunStatus: lastExec?.status,
			runCount: executions.length,
		});
	}

	return results;
}

export async function getWorkflowSteps(workflowId: string) {
	return db
		.select()
		.from(automationSteps)
		.where(eq(automationSteps.workflowId, workflowId))
		.orderBy(automationSteps.stepOrder);
}

export async function createWorkflow(
	companyId: string,
	data: {
		name: string;
		description?: string;
		triggerType: string;
		triggerConfig: Record<string, unknown>;
		autonomy: string;
	},
) {
	const [wf] = await db
		.insert(automationWorkflows)
		.values({
			companyId,
			name: data.name,
			description: data.description ?? null,
			category: "other",
			triggerType: data.triggerType as any,
			triggerConfig: data.triggerConfig,
			status: "draft",
			// autonomy stored in a dedicated column or triggerConfig when available
		})
		.returning();
	return wf;
}

export async function createStep(
	workflowId: string,
	data: {
		stepOrder: number;
		skillId: string;
	},
) {
	const [step] = await db
		.insert(automationSteps)
		.values({
			workflowId,
			stepOrder: data.stepOrder,
			stepType: "action",
			actionType: "execute_skill",
			config: { skillId: data.skillId },
			status: "active",
		})
		.returning();
	return step;
}

export async function updateWorkflowStatus(
	workflowId: string,
	status: string,
) {
	const [wf] = await db
		.update(automationWorkflows)
		.set({ status: status as any, updatedAt: new Date() })
		.where(eq(automationWorkflows.id, workflowId))
		.returning();
	return wf ?? null;
}

export async function getExecutionLogs(
	workflowId: string,
	limit = 20,
	offset = 0,
): Promise<AutomationLogEntry[]> {
	const rows = await db
		.select()
		.from(automationExecutions)
		.where(eq(automationExecutions.workflowId, workflowId))
		.orderBy(desc(automationExecutions.startedAt))
		.limit(limit)
		.offset(offset);

	return rows.map((r) => ({
		id: r.id,
		automationId: r.workflowId,
		status: r.status,
		startedAt: r.startedAt.toISOString(),
		completedAt: r.completedAt?.toISOString(),
		resultSummary: r.resultSummary ?? undefined,
		error: r.error ?? undefined,
	}));
}

export async function triggerExecution(
	workflowId: string,
	triggeredBy: string,
) {
	const [exec] = await db
		.insert(automationExecutions)
		.values({
			workflowId,
			triggeredBy,
			status: "running",
			startedAt: new Date(),
		})
		.returning();
	return exec;
}
