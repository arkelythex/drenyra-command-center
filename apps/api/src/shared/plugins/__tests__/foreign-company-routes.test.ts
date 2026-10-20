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
import { bankingRoutes } from "../../../features/banking";
import { complianceModule } from "../../../features/compliance";
import { evidenceV2Routes } from "../../../features/evidence-v2/routes";
import { reconciliationsModule } from "../../../features/reconciliations";

const OWN = "11111111-1111-4111-8111-111111111111";
const FOREIGN = "22222222-2222-4222-8222-222222222222";

const app = new Elysia()
	.use(analyticsModule)
	.use(complianceModule)
	.use(evidenceV2Routes)
	.use(reconciliationsModule)
	.use(bankingRoutes);

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
		"/api/banking/accounts",
		"/api/banking/summary",
	])("is refused with 403 on %s", async (path) => {
		const response = await app.handle(
			new Request(`http://localhost${path}?companyId=${FOREIGN}`),
		);

		expect(response.status).toBe(403);
		expect(await response.json()).toMatchObject({
			code: "COMPANY_SCOPE_MISMATCH",
		});
	});

	const ACCOUNT = "33333333-3333-4333-8333-333333333333";
	it.each([
		[
			"/api/banking/accounts",
			{
				companyId: FOREIGN,
				accountName: "BCP",
				accountNumber: "191-0000000-0-00",
				accountType: "CHECKING",
				bankName: "BCP",
				currency: "PEN",
			},
		],
		[
			"/api/banking/transactions",
			{
				companyId: FOREIGN,
				accountId: ACCOUNT,
				transactionDate: "2026-09-01",
				description: "x",
				type: "CREDIT",
				amount: 1,
			},
		],
		[
			"/api/banking/import",
			{
				companyId: FOREIGN,
				accountId: ACCOUNT,
				transactions: [],
			},
		],
		["/api/banking/auto-reconcile", { companyId: FOREIGN, accountId: ACCOUNT }],
	])("is refused with 403 on POST %s", async (path, body) => {
		const response = await app.handle(
			new Request(`http://localhost${path}`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(body),
			}),
		);

		expect(response.status).toBe(403);
		expect(await response.json()).toMatchObject({
			code: "COMPANY_SCOPE_MISMATCH",
		});
	});
});
