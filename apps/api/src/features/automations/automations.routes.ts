import { eq } from "@drenyra/persistence/query";
import { automationWorkflows } from "@drenyra/persistence/schema/automation-studio.schema";
import { Elysia } from "elysia";
import { db } from "../../lib/db";
import { AppError } from "../../lib/errors";
import { companyScopeGuard } from "../../shared/plugins";
import { fail, getErrorMessage, ok } from "../shared/api-response";
import {
	CreateAutomationBody,
	IdParams,
	ListAutomationQuery,
	LogQuery,
	RunBody,
	ToggleBody,
	UpdateAutomationBody,
} from "./automations.schemas";
import * as automationsService from "./automations.service";

function handleError(error: unknown, set: { status: number }) {
	if (error instanceof AppError) {
		set.status = error.statusCode;
		return fail(error.message, error.errorCode);
	}
	set.status = 500;
	return fail(getErrorMessage(error), "INTERNAL_ERROR");
}

export const automationsRoutes = new Elysia({
	prefix: "/api/automations",
	name: "automations",
})
	.use(companyScopeGuard())

	// ─── List automations ───
	.get(
		"/",
		async ({ query, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}
				const data = await automationsService.listCompanyAutomations(
					companyId,
					query.status,
				);
				return ok({ data });
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{
			query: ListAutomationQuery,
			detail: {
				tags: ["Automations"],
				summary: "List automations for company",
			},
		},
	)

	// ─── Get automation detail ───
	.get(
		"/:id",
		async ({ params, set }) => {
			try {
				// Returns detail with execution logs
				const logs = await automationsService.getExecutionLogs(params.id);
				// Find the workflow
				const workflows = await automationsService.listCompanyAutomations(
					"",
					"",
				);
				const wf = workflows.find((w) => w.id === params.id);
				if (!wf) {
					set.status = 404;
					return fail("Automation no encontrada", "NOT_FOUND");
				}
				return ok({ ...wf, executionLogs: logs });
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{
			params: IdParams,
			detail: {
				tags: ["Automations"],
				summary: "Get automation detail with execution logs",
			},
		},
	)

	// ─── Create automation ───
	.post(
		"/",
		async ({ body, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}

				// Create workflow
				const wf = await automationsService.createWorkflow(companyId, {
					name: body.name,
					description: body.description,
					triggerType: body.triggerType,
					triggerConfig: body.triggerConfig,
					autonomy: body.autonomy,
				});

				// Create steps for each skill
				for (let i = 0; i < body.skillIds.length; i++) {
					await automationsService.createStep(wf.id, {
						stepOrder: i + 1,
						skillId: body.skillIds[i],
					});
				}

				set.status = 201;
				return ok({ id: wf.id, name: wf.name });
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{
			body: CreateAutomationBody,
			detail: {
				tags: ["Automations"],
				summary: "Create a new automation",
			},
		},
	)

	// ─── Update automation ───
	.patch(
		"/:id",
		async ({ params, body, set }) => {
			try {
				// For now, we only update status/name via the existing update mechanism
				// Full step management would go here
				if (body.name) {
					await db
						.update(automationWorkflows)
						.set({ name: body.name, updatedAt: new Date() })
						.where(eq(automationWorkflows.id, params.id));
				}

				return ok({ id: params.id, updated: true });
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{
			params: IdParams,
			body: UpdateAutomationBody,
			detail: {
				tags: ["Automations"],
				summary: "Update automation",
			},
		},
	)

	// ─── Toggle automation active/paused ───
	.post(
		"/:id/toggle",
		async ({ params, body, set }) => {
			try {
				const newStatus = body.active ? "active" : "paused";
				const wf = await automationsService.updateWorkflowStatus(
					params.id,
					newStatus,
				);
				if (!wf) {
					set.status = 404;
					return fail("Automation no encontrada", "NOT_FOUND");
				}
				return ok({
					id: wf.id,
					name: wf.name,
					status: wf.status,
					active: wf.status === "active",
				});
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{
			params: IdParams,
			body: ToggleBody,
			detail: {
				tags: ["Automations"],
				summary: "Activate or pause automation",
			},
		},
	)

	// ─── Get execution logs ───
	.get(
		"/:id/logs",
		async ({ params, query, set }) => {
			try {
				const logs = await automationsService.getExecutionLogs(
					params.id,
					query.limit ?? 20,
					query.offset ?? 0,
				);
				return ok({ data: logs });
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{
			params: IdParams,
			query: LogQuery,
			detail: {
				tags: ["Automations"],
				summary: "Get automation execution logs",
			},
		},
	)

	// ─── Run automation manually ───
	.post(
		"/run",
		async ({ body, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}
				const exec = await automationsService.triggerExecution(
					body.automationId,
					companyId,
				);
				set.status = 202;
				return ok({ executionId: exec.id });
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{
			body: RunBody,
			detail: {
				tags: ["Automations"],
				summary: "Manual trigger of an automation",
			},
		},
	);

function s(set: { status?: number | string }): { status: number } {
	return set as unknown as { status: number };
}
