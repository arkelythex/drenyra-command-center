import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";

import { aiSwarmRoutes } from "../../api/routes";

describe("ai-swarm compatibility facade over ai control-plane", () => {
	it("returns policy preview with deterministic fallback for blocked tool", async () => {
		const app = new Elysia().use(aiSwarmRoutes);

		const response = await app.handle(
			new Request("http://localhost/api/ai-swarm/compat/policy/preview", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					traceId: "trace-compat-tool-blocked",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
					requestedCapability: "advisory.review",
					requestedTool: "journal.post",
				}),
			}),
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			success: true,
			data: {
				allowed: false,
				fallbackMode: "deterministic-required",
				violations: expect.arrayContaining(["tool-not-allowed"]),
			},
		});
	});

	it("returns least-privilege tools through the legacy ai-swarm facade", async () => {
		const app = new Elysia().use(aiSwarmRoutes);

		const response = await app.handle(
			new Request("http://localhost/api/ai-swarm/compat/capabilities/tools", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					agentId: "agent-reconciliation",
					requestedCapability: "advisory.review",
				}),
			}),
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			success: true,
			data: {
				allowedTools: ["ledger.read", "sunat.lookup"],
			},
		});
	});
});
