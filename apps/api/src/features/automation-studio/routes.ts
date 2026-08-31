import { Elysia, t } from "elysia";
import { companyScopeGuard } from "../../shared/plugins";
import { fail, getErrorMessage, ok } from "../shared/api-response";
import * as controller from "./controller";

const WorkflowCategoryEnum = t.UnionEnum([
	"alerts",
	"reconciliation",
	"reporting",
	"compliance",
	"notifications",
	"other",
]);

const TriggerTypeEnum = t.UnionEnum(["schedule", "event", "hook", "webhook"]);

const StepTypeEnum = t.UnionEnum(["condition", "action", "wait", "loop"]);

import { actionTypeEnum } from "@drenyra/persistence/schema";

const ActionTypeEnum = t.UnionEnum(actionTypeEnum);

const StepStatusEnum = t.UnionEnum(["active", "paused"]);

const IdParams = t.Object({
	id: t.String({ minLength: 1 }),
});

const ExecIdParams = t.Object({
	id: t.String({ minLength: 1 }),
	execId: t.String({ minLength: 1 }),
});

const CWorkflowBody = t.Object({
	name: t.String({ minLength: 1 }),
	description: t.Optional(t.String()),
	category: WorkflowCategoryEnum,
	triggerType: TriggerTypeEnum,
	triggerConfig: t.Any(),
});

const UWorkflowBody = t.Object({
	name: t.Optional(t.String({ minLength: 1 })),
	description: t.Optional(t.String()),
	category: t.Optional(WorkflowCategoryEnum),
	triggerType: t.Optional(TriggerTypeEnum),
	triggerConfig: t.Optional(t.Any()),
});

const CStepBody = t.Object({
	workflowId: t.String({ minLength: 1 }),
	stepOrder: t.Number(),
	stepType: StepTypeEnum,
	actionType: ActionTypeEnum,
	config: t.Any(),
});

const UStepBody = t.Object({
	stepOrder: t.Optional(t.Number()),
	stepType: t.Optional(StepTypeEnum),
	actionType: t.Optional(ActionTypeEnum),
	config: t.Optional(t.Any()),
	status: t.Optional(StepStatusEnum),
});

const ReorderBody = t.Object({
	workflowId: t.String({ minLength: 1 }),
	stepIds: t.Array(t.String(), { minItems: 1 }),
});

const ListWfQuery = t.Object({
	status: t.Optional(t.String()),
	category: t.Optional(t.String()),
});

const StepsListQuery = t.Object({
	workflowId: t.String({ minLength: 1 }),
});

export const automationStudioRoutes = new Elysia({
	prefix: "/api/v1/automation",
	name: "automation-studio",
})
	.use(companyScopeGuard({ allowHeaderFallback: true }))

	// --- Dashboard ---
	.get(
		"/dashboard",
		async ({ companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}
				const stats = await controller.getDashboardStats(companyId);
				return ok(stats);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			detail: {
				tags: ["Automation Studio"],
				summary: "Dashboard stats for automation studio",
			},
		},
	)

	// --- CRUD Workflows ---
	.get(
		"/workflows",
		async ({ query, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}
				const result = await controller.listWorkflows(
					companyId,
					query.status,
					query.category,
				);
				return ok(result);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			query: ListWfQuery,
			detail: {
				tags: ["Automation Studio"],
				summary: "List workflows",
			},
		},
	)

	.get(
		"/workflows/:id",
		async ({ params, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}
				const wf = await controller.getWorkflow(companyId, params.id);
				if (!wf) {
					set.status = 404;
					return fail("Workflow no encontrado", "NOT_FOUND");
				}
				return ok(wf);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: IdParams,
			detail: {
				tags: ["Automation Studio"],
				summary: "Get workflow by ID",
			},
		},
	)

	.post(
		"/workflows",
		async ({ body, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}
				const wf = await controller.createWorkflow(companyId, body);
				set.status = 201;
				return ok(wf);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			body: CWorkflowBody,
			detail: {
				tags: ["Automation Studio"],
				summary: "Create workflow",
			},
		},
	)

	.patch(
		"/workflows/:id",
		async ({ params, body, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}
				const wf = await controller.updateWorkflow(companyId, params.id, body);
				if (!wf) {
					set.status = 404;
					return fail("Workflow no encontrado", "NOT_FOUND");
				}
				return ok(wf);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: IdParams,
			body: UWorkflowBody,
			detail: {
				tags: ["Automation Studio"],
				summary: "Update workflow",
			},
		},
	)

	.delete(
		"/workflows/:id",
		async ({ params, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}
				const deleted = await controller.deleteWorkflow(companyId, params.id);
				if (!deleted) {
					set.status = 404;
					return fail("Workflow no encontrado", "NOT_FOUND");
				}
				return ok({ deleted: true });
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: IdParams,
			detail: {
				tags: ["Automation Studio"],
				summary: "Delete workflow",
			},
		},
	)

	// --- Workflow actions ---
	.post(
		"/workflows/:id/activate",
		async ({ params, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}
				const wf = await controller.activateWorkflow(companyId, params.id);
				if (!wf) {
					set.status = 404;
					return fail("Workflow no encontrado", "NOT_FOUND");
				}
				return ok(wf);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: IdParams,
			detail: {
				tags: ["Automation Studio"],
				summary: "Activate workflow",
			},
		},
	)

	.post(
		"/workflows/:id/pause",
		async ({ params, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}
				const wf = await controller.pauseWorkflow(companyId, params.id);
				if (!wf) {
					set.status = 404;
					return fail("Workflow no encontrado", "NOT_FOUND");
				}
				return ok(wf);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: IdParams,
			detail: {
				tags: ["Automation Studio"],
				summary: "Pause workflow",
			},
		},
	)

	.post(
		"/workflows/:id/test",
		async ({ params, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}
				const result = await controller.testWorkflow(companyId, params.id);
				return ok(result);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: IdParams,
			detail: {
				tags: ["Automation Studio"],
				summary: "Test run a workflow",
			},
		},
	)

	.post(
		"/workflows/:id/duplicate",
		async ({ params, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}
				const wf = await controller.duplicateWorkflow(companyId, params.id);
				if (!wf) {
					set.status = 404;
					return fail("Workflow no encontrado", "NOT_FOUND");
				}
				set.status = 201;
				return ok(wf);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: IdParams,
			detail: {
				tags: ["Automation Studio"],
				summary: "Duplicate workflow",
			},
		},
	)

	// --- Executions ---
	.get(
		"/workflows/:id/executions",
		async ({ params, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}
				const result = await controller.listExecutions(companyId, params.id);
				return ok(result);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: IdParams,
			detail: {
				tags: ["Automation Studio"],
				summary: "List workflow executions",
			},
		},
	)

	.get(
		"/workflows/:id/executions/:execId",
		async ({ params, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}
				const exec = await controller.getExecution(companyId, params.execId);
				if (!exec) {
					set.status = 404;
					return fail("Ejecución no encontrada", "NOT_FOUND");
				}
				return ok(exec);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: ExecIdParams,
			detail: {
				tags: ["Automation Studio"],
				summary: "Get execution detail",
			},
		},
	)

	// --- Steps ---
	.get(
		"/steps",
		async ({ query, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}
				const result = await controller.listSteps(companyId, query.workflowId);
				return ok(result);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			query: StepsListQuery,
			detail: {
				tags: ["Automation Studio"],
				summary: "List steps for a workflow",
			},
		},
	)

	.get(
		"/steps/:id",
		async ({ params, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}
				const step = await controller.getStep(companyId, params.id);
				if (!step) {
					set.status = 404;
					return fail("Step no encontrado", "NOT_FOUND");
				}
				return ok(step);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: IdParams,
			detail: {
				tags: ["Automation Studio"],
				summary: "Get step by ID",
			},
		},
	)

	.post(
		"/steps",
		async ({ body, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}
				const step = await controller.createStep(companyId, body);
				if (!step) {
					set.status = 400;
					return fail("No se pudo crear el step", "VALIDATION_ERROR");
				}
				set.status = 201;
				return ok(step);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			body: CStepBody,
			detail: {
				tags: ["Automation Studio"],
				summary: "Create step",
			},
		},
	)

	.patch(
		"/steps/:id",
		async ({ params, body, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}
				const step = await controller.updateStep(companyId, params.id, body);
				if (!step) {
					set.status = 404;
					return fail("Step no encontrado", "NOT_FOUND");
				}
				return ok(step);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: IdParams,
			body: UStepBody,
			detail: {
				tags: ["Automation Studio"],
				summary: "Update step",
			},
		},
	)

	.delete(
		"/steps/:id",
		async ({ params, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}
				const deleted = await controller.deleteStep(companyId, params.id);
				if (!deleted) {
					set.status = 404;
					return fail("Step no encontrado", "NOT_FOUND");
				}
				return ok({ deleted: true });
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: IdParams,
			detail: {
				tags: ["Automation Studio"],
				summary: "Delete step",
			},
		},
	)

	.post(
		"/steps/reorder",
		async ({ body, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}
				const steps = await controller.reorderSteps(companyId, body);
				return ok({ data: steps });
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			body: ReorderBody,
			detail: {
				tags: ["Automation Studio"],
				summary: "Reorder steps within a workflow",
			},
		},
	);
