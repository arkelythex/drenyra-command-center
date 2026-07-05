import { describe, expect, it } from "vitest";
import { agentAuditTrailRoutes } from "../api/routes";

describe("Agent Audit Trail Routes", () => {
	it("should list registered plugins", async () => {
		const response = await agentAuditTrailRoutes.handle(
			new Request("http://localhost/audit-trail/plugins", {
				headers: {
					"x-user-id": "test-user-1",
					"x-user-role": "admin",
					"x-company-id": "cmp-1",
				},
			}),
		);

		expect(response.status).toBe(200);
		const payload = (await response.json()) as {
			success: boolean;
			data: Array<{ id: string }>;
		};

		expect(payload.success).toBe(true);
		expect(
			payload.data.some((plugin) => plugin.id === "bcp-reconciliation-v1"),
		).toBe(true);
	});

	it("should pass zero-trust plugin preflight for valid contract", async () => {
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
					id: `plugin-preflight-${Date.now()}`,
					name: "Preflight Plugin",
					version: "1.0.0",
					description: "Plugin validation smoke test",
					capabilities: ["audit:read-inputs", "audit:emit-finding"],
					allowedPaths: ["inputs.bankCode"],
					conditions: [
						{
							kind: "path",
							path: "inputs.bankCode",
							operator: "eq",
							value: "BCP",
						},
					],
					finding: {
						code: "PRECHECK_OK",
						message: "match",
						severity: "medium",
					},
				}),
			}),
		);

		expect(response.status).toBe(200);
		const payload = (await response.json()) as {
			success: boolean;
			data: { valid: boolean; zeroTrust: boolean };
		};
		expect(payload.success).toBe(true);
		expect(payload.data.valid).toBe(true);
		expect(payload.data.zeroTrust).toBe(true);
	});

	it("should reject plugin preflight when capability does not allow path access", async () => {
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
					id: `plugin-preflight-invalid-${Date.now()}`,
					name: "Invalid Preflight Plugin",
					version: "1.0.0",
					description: "Should fail zero-trust check",
					capabilities: ["audit:read-inputs", "audit:emit-finding"],
					allowedPaths: ["outputs.total"],
					conditions: [
						{
							kind: "path",
							path: "outputs.total",
							operator: "gt",
							value: 1000,
						},
					],
					finding: {
						code: "PRECHECK_FAIL",
						message: "match",
						severity: "high",
					},
				}),
			}),
		);

		expect(response.status).toBe(422);
		const payload = (await response.json()) as {
			success: boolean;
			code: string;
		};
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("PLUGIN_PREFLIGHT_FAILED");
	});
});
