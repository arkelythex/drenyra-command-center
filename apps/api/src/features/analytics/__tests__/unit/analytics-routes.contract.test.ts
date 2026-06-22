import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AnalyticsService, analyticsModule } from "../../index";

// Mock resolveSessionContext so the companyScopeGuard doesn't reject requests
vi.mock("../../../security/session-context", () => ({
	resolveSessionContext: vi.fn(),
}));

import { resolveSessionContext } from "../../../security/session-context";

const mockResolve = resolveSessionContext as unknown as ReturnType<
	typeof vi.fn
>;

const COMPANY_ID = "47ab7ee0-6778-4cc3-a7de-9e93d57d95bc";

function buildApp(): Elysia {
	return new Elysia().use(analyticsModule);
}

describe("analytics route contracts", () => {
	beforeEach(() => {
		mockResolve.mockResolvedValue({
			ok: true,
			context: {
				userId: "test-user",
				authUserId: "test-user",
				legacyUserId: null,
				role: "admin",
				companyId: "test-company",
			},
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns a canonical failure envelope for invalid query params", async () => {
		const response = await buildApp().handle(
			new Request("http://localhost/api/analytics/operational"),
		);

		expect(response.status).toBe(422);
		expect(await response.json()).toMatchObject({
			success: false,
			error: "Invalid analytics query parameters",
			code: "VALIDATION_ERROR",
		});
	});

	it("returns a canonical failure envelope for service failures", async () => {
		vi.spyOn(AnalyticsService, "getOperationalKPIs").mockRejectedValue(
			new Error("analytics backend unavailable"),
		);

		const response = await buildApp().handle(
			new Request(
				`http://localhost/api/analytics/operational?companyId=${COMPANY_ID}`,
			),
		);

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({
			success: false,
			error: "analytics backend unavailable",
			code: "INTERNAL_ERROR",
		});
	});
});
