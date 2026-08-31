import { beforeEach, describe, expect, it, vi } from "vitest";

const controllerMocks = vi.hoisted(() => ({
	getWorkflow: vi.fn(),
	updateWorkflow: vi.fn(),
	deleteWorkflow: vi.fn(),
	activateWorkflow: vi.fn(),
	pauseWorkflow: vi.fn(),
	testWorkflow: vi.fn(),
	duplicateWorkflow: vi.fn(),
}));

vi.mock("../../controller", () => controllerMocks);

import { automationStudioRoutes } from "../../routes";

const WORKFLOW_ID = "workflow-tenant-test";

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
];

describe("Automation Studio workflow tenant isolation", () => {
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
