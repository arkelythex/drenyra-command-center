import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { agentAuditTrailRoutes } from "../../api/routes";

describe("agent-audit-trail route schema hardening", () => {
	it("does not use raw t.Any() in externally reachable route schemas", () => {
		const routesPath = resolve(
			process.cwd(),
			"src/features/agent-audit-trail/api/routes.ts",
		);
		const source = readFileSync(routesPath, "utf-8");

		expect(source).not.toContain("t.Any(");
	});

	it("returns 422 when plugin preflight condition is missing required fields", async () => {
		const response = await agentAuditTrailRoutes.handle(
			new Request("http://localhost/audit-trail/plugins/preflight", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-user-id": "test-user-1",
					"x-user-role": "admin",
					"x-company-id": "cmp-1",
				},
				body: JSON.stringify({
					id: `plugin-preflight-invalid-schema-${Date.now()}`,
					name: "Invalid schema plugin",
					version: "1.0.0",
					description: "schema hardening regression",
					capabilities: ["audit:read-inputs", "audit:emit-finding"],
					allowedPaths: ["inputs.bankCode"],
					conditions: [
						{
							kind: "path",
							path: "inputs.bankCode",
							value: "BCP",
						},
					],
					finding: {
						code: "PRECHECK_INVALID_SCHEMA",
						message: "match",
						severity: "medium",
					},
				}),
			}),
		);

		expect(response.status).toBe(422);
	});
});
