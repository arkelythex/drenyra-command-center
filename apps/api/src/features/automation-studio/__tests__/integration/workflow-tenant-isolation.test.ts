import { beforeEach, describe, expect, it, vi } from "vitest";

const controllerMocks = vi.hoisted(() => ({
	getWorkflow: vi.fn(),
	updateWorkflow: vi.fn(),
	deleteWorkflow: vi.fn(),
	activateWorkflow: vi.fn(),
	pauseWorkflow: vi.fn(),
	testWorkflow: vi.fn(),
	duplicateWorkflow: vi.fn(),
	listSteps: vi.fn(),
	getStep: vi.fn(),
	createStep: vi.fn(),
	updateStep: vi.fn(),
	deleteStep: vi.fn(),
	reorderSteps: vi.fn(),
	listExecutions: vi.fn(),
	getExecution: vi.fn(),
}));

vi.mock("../../controller", () => controllerMocks);

import { automationStudioRoutes } from "../../routes";

const WORKFLOW_ID = "workflow-tenant-test";
const STEP_ID = "step-tenant-test";
const EXECUTION_ID = "execution-tenant-test";

interface UnauthorizedRouteCase {
	name: string;
	method: string;
	path: string;
	body?: Record<string, unknown>;
	controller: ReturnType<typeof vi.fn>;
}

const unauthorizedRouteCases: UnauthorizedRouteCase[] = [
	{
		name: "get workflow",
		method: "GET",
		path: `/api/v1/automation/workflows/${WORKFLOW_ID}`,
		controller: controllerMocks.getWorkflow,
	},
	{
		name: "update workflow",
		method: "PATCH",
		path: `/api/v1/automation/workflows/${WORKFLOW_ID}`,
		body: {},
		controller: controllerMocks.updateWorkflow,
	},
	{
		name: "delete workflow",
		method: "DELETE",
		path: `/api/v1/automation/workflows/${WORKFLOW_ID}`,
		controller: controllerMocks.deleteWorkflow,
	},
	{
		name: "activate workflow",
		method: "POST",
		path: `/api/v1/automation/workflows/${WORKFLOW_ID}/activate`,
		controller: controllerMocks.activateWorkflow,
	},
	{
		name: "pause workflow",
		method: "POST",
		path: `/api/v1/automation/workflows/${WORKFLOW_ID}/pause`,
		controller: controllerMocks.pauseWorkflow,
	},
	{
		name: "test workflow",
		method: "POST",
		path: `/api/v1/automation/workflows/${WORKFLOW_ID}/test`,
		controller: controllerMocks.testWorkflow,
	},
	{
		name: "duplicate workflow",
		method: "POST",
		path: `/api/v1/automation/workflows/${WORKFLOW_ID}/duplicate`,
		controller: controllerMocks.duplicateWorkflow,
	},
	{
		name: "list steps",
		method: "GET",
		path: `/api/v1/automation/steps?workflowId=${WORKFLOW_ID}`,
		controller: controllerMocks.listSteps,
	},
	{
		name: "get step",
		method: "GET",
		path: `/api/v1/automation/steps/${STEP_ID}`,
		controller: controllerMocks.getStep,
	},
	{
		name: "create step",
		method: "POST",
		path: "/api/v1/automation/steps",
		body: {
			workflowId: WORKFLOW_ID,
			stepOrder: 0,
			stepType: "action",
			actionType: "send_notification",
			config: {},
		},
		controller: controllerMocks.createStep,
	},
	{
		name: "update step",
		method: "PATCH",
		path: `/api/v1/automation/steps/${STEP_ID}`,
		body: {},
		controller: controllerMocks.updateStep,
	},
	{
		name: "delete step",
		method: "DELETE",
		path: `/api/v1/automation/steps/${STEP_ID}`,
		controller: controllerMocks.deleteStep,
	},
	{
		name: "reorder steps",
		method: "POST",
		path: "/api/v1/automation/steps/reorder",
		body: {
			workflowId: WORKFLOW_ID,
			stepIds: [STEP_ID],
		},
		controller: controllerMocks.reorderSteps,
	},
	{
		name: "list executions",
		method: "GET",
		path: `/api/v1/automation/workflows/${WORKFLOW_ID}/executions`,
		controller: controllerMocks.listExecutions,
	},
	{
		name: "get execution",
		method: "GET",
		path: `/api/v1/automation/workflows/${WORKFLOW_ID}/executions/${EXECUTION_ID}`,
		controller: controllerMocks.getExecution,
	},
];

describe("Automation Studio tenant isolation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it.each(unauthorizedRouteCases)(
		"rejects $name without tenant context before calling the controller",
		async ({ method, path, body, controller }) => {
			const response = await automationStudioRoutes.handle(
				new Request(`http://localhost${path}`, {
					method,
					...(body
						? {
								body: JSON.stringify(body),
								headers: { "content-type": "application/json" },
							}
						: {}),
				}),
			);

			expect(response.status).toBe(401);
			expect(await response.json()).toEqual({
				success: false,
				error: "No autorizado",
				code: "UNAUTHORIZED",
			});
			expect(controller).not.toHaveBeenCalled();
		},
	);
});
