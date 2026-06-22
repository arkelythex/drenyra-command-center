import { Elysia } from "elysia";
import { describe, expect, it, vi } from "vitest";

const analyzeTaskMock = vi.hoisted(() =>
	vi.fn(async () => ({
		shouldParallelize: false,
		batchSize: 1,
		estimatedCost: 0,
		estimatedTime: 1,
		agentsRequired: [],
	})),
);

vi.mock("../../orchestrator/orchestrator.service", () => ({
	OrchestratorService: class {
		analyzeTask = analyzeTaskMock;
	},
}));

import { workflowRoute } from "../../api/workflow.route";

async function postAnalyzeTask(
	headers: Record<string, string>,
): Promise<Response> {
	const app = new Elysia().use(workflowRoute);
	return app.handle(
		new Request("http://localhost/api/ai-swarm/analyze-task", {
			method: "POST",
			headers: { "content-type": "application/json", ...headers },
			body: JSON.stringify({
				fileCount: 1,
				totalSizeBytes: 1024,
				taskType: "INVOICE",
				priority: "medium",
			}),
		}),
	);
}

describe("AI Swarm workflow tenant conflict guard", () => {
	it("rejects conflicting organization headers before executing workflow analysis", async () => {
		const response = await postAnalyzeTask({
			"x-organization-id": "42",
			"x-company-id": "73",
		});
		const payload = await response.json();

		expect(response.status).toBe(400);
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("TENANT_CONTEXT_CONFLICT");
		expect(analyzeTaskMock).not.toHaveBeenCalled();
	});
});
