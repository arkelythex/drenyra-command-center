import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import { drenyraHarnessRoutes } from "../harness.routes";

const fiscalHeaders = {
	"x-organization-id": "org-1",
	"x-company-id": "co-1",
	"x-company-ruc": "20601234567",
	"x-fiscal-period": "2024-01",
	"x-user-id": "user-1",
};

describe("drenyra harness routes", () => {
	it("lists registered agents", async () => {
		const app = new Elysia({ prefix: "/api/fiscal-command-center" }).use(
			drenyraHarnessRoutes,
		);
		const response = await app.handle(
			new Request("http://localhost/api/fiscal-command-center/harness/agents"),
		);
		expect(response.status).toBe(200);
		const json = await response.json();
		expect(json.success).toBe(true);
		expect(json.data.agents).toContain("fiscal-command-orchestrator");
	});

	it("executes nested fiscal delegation", async () => {
		const app = new Elysia({ prefix: "/api/fiscal-command-center" }).use(
			drenyraHarnessRoutes,
		);
		const response = await app.handle(
			new Request("http://localhost/api/fiscal-command-center/harness/execute", {
				method: "POST",
				headers: {
					...fiscalHeaders,
					"content-type": "application/json",
				},
				body: JSON.stringify({
					task: "Revisar SIRE del periodo",
					autoSpawn: true,
				}),
			}),
		);
		expect(response.status).toBe(200);
		const json = await response.json();
		expect(json.success).toBe(true);
		expect(json.data.tree.children.length).toBeGreaterThan(0);
	});
});
