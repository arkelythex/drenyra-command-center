import { Elysia } from "elysia";
import { describe, expect, it, vi } from "vitest";
import { createAgentRunsRoutes } from "../agent-runs.routes";

describe("agent-runs routes", () => {
	it("returns 400 when tenant headers are missing", async () => {
		const app = new Elysia({ prefix: "/api/fiscal-command-center" }).use(
			createAgentRunsRoutes(),
		);
		const response = await app.handle(
			new Request("http://localhost/api/fiscal-command-center/agent-runs"),
		);

		expect(response.status).toBe(400);
	});

	it("returns 404 for unknown run logs", async () => {
		const service = {
			list: vi.fn(),
			getById: vi.fn(),
			create: vi.fn(),
			getLogs: vi.fn().mockResolvedValue(null),
			getOutputs: vi.fn(),
		};
		const app = new Elysia({ prefix: "/api/fiscal-command-center" }).use(
			createAgentRunsRoutes(service as never),
		);

		const response = await app.handle(
			new Request(
				"http://localhost/api/fiscal-command-center/agent-runs/run-1/logs",
				{
					headers: {
						"x-organization-id": "org-1",
						"x-company-id": "cmp-1",
						"x-user-id": "usr-1",
						"x-company-ruc": "20123456789",
						"x-fiscal-period": "2026-01",
					},
				},
			),
		);

		expect(response.status).toBe(404);
		expect(service.getLogs).toHaveBeenCalledOnce();
	});
});
