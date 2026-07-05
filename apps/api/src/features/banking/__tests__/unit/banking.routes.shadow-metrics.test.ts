import { Elysia } from "elysia";
import { afterEach, describe, expect, it, vi } from "vitest";
import { bankingRoutes } from "../../api/banking.routes";
import { ReconciliationService } from "../../application/services/reconciliation.service";

describe("banking routes / reconciliation shadow metrics", () => {
	const app = new Elysia().use(bankingRoutes);

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns reconciliation shadow metrics snapshot", async () => {
		vi.spyOn(ReconciliationService, "getShadowMetrics").mockResolvedValue({
			enabled: true,
			toleranceCents: 10,
			runs: 2,
			failedRuns: 1,
			matchedByLocalEngine: 5,
			matchedByGoWorker: 4,
			discrepancies: 1,
			persistedRuns: [],
			byCompany: [
				{
					companyId: "cmp-1",
					runs: 2,
					failedRuns: 1,
					matchedByLocalEngine: 5,
					matchedByGoWorker: 4,
					discrepancies: 1,
				},
			],
		});

		const response = await app.handle(
			new Request(
				"http://localhost/api/banking/reconciliation-shadow/metrics?companyId=cmp-1",
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				enabled: true,
				runs: 2,
				byCompany: [
					{
						companyId: "cmp-1",
						discrepancies: 1,
					},
				],
			},
		});
	});
});
