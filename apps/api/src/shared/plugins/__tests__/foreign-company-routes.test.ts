/**
 * Modules that take `companyId` from the query must not serve another
 * company's data to a signed-in user of a different company.
 */
import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { resolveSessionContext } = vi.hoisted(() => ({
	resolveSessionContext: vi.fn(),
}));

vi.mock("../../../features/security/session-context", () => ({
	resolveSessionContext,
}));

import { analyticsModule } from "../../../features/analytics";
import { complianceModule } from "../../../features/compliance";
import { evidenceV2Routes } from "../../../features/evidence-v2/routes";
import { reconciliationsModule } from "../../../features/reconciliations";

const OWN = "11111111-1111-4111-8111-111111111111";
const FOREIGN = "22222222-2222-4222-8222-222222222222";

const app = new Elysia()
	.use(analyticsModule)
	.use(complianceModule)
	.use(evidenceV2Routes)
	.use(reconciliationsModule);

describe("foreign companyId", () => {
	beforeEach(() => {
		resolveSessionContext.mockResolvedValue({
			ok: true,
			context: {
				userId: "user-1",
				authUserId: "user-1",
				legacyUserId: null,
				role: "admin",
				companyId: OWN,
			},
		});
	});

	it.each([
		"/api/analytics/dashboard",
		"/api/compliance/dashboard",
		"/api/compliance/issues",
		"/api/v2/evidence/search",
		"/api/reconciliations/pending",
	])("is refused with 403 on %s", async (path) => {
		const response = await app.handle(
			new Request(`http://localhost${path}?companyId=${FOREIGN}`),
		);

		expect(response.status).toBe(403);
		expect(await response.json()).toMatchObject({
			code: "COMPANY_SCOPE_MISMATCH",
		});
	});
});
