import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";

import { getTenantFromHeaders, tenantMiddleware } from "../tenant.middleware";

function buildProbeApp(): Elysia {
	return new Elysia()
		.use(tenantMiddleware)
		.get("/protected", ({ tenant }) => ({ success: true, tenant }))
		.get("/health/live", () => ({ ok: true }));
}

describe("tenant middleware fail-closed policy", () => {
	it("rejects protected requests when tenant header is missing", async () => {
		const response = await buildProbeApp().handle(
			new Request("http://localhost/protected"),
		);

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({
			success: false,
			error: "Tenant context is required",
			code: "TENANT_REQUIRED",
		});
	});

	it("allows public health requests without tenant context", async () => {
		const response = await buildProbeApp().handle(
			new Request("http://localhost/health/live"),
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: true });
	});

	it("rejects invalid company type values instead of casting them", async () => {
		const response = await buildProbeApp().handle(
			new Request("http://localhost/protected", {
				headers: {
					"X-Organization-Id": "org-1",
					"X-Company-Type": "holding",
				},
			}),
		);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			success: false,
			error: "Invalid X-Company-Type header",
			code: "INVALID_COMPANY_TYPE",
		});
	});

	it("resolves tenant from headers without default fallback", () => {
		expect(() =>
			getTenantFromHeaders(new Request("http://localhost/protected")),
		).toThrow("Tenant context is required");

		expect(
			getTenantFromHeaders(
				new Request("http://localhost/protected", {
					headers: {
						"X-Organization-Id": "org-1",
						"X-Company-Type": "empresa",
					},
				}),
			),
		).toMatchObject({
			organizationId: "org-1",
			companyType: "empresa",
			plan: "pro",
		});
	});
});
