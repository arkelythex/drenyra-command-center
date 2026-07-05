import { Elysia } from "elysia";
import { afterEach, describe, expect, it, vi } from "vitest";
import { bankingRoutes } from "../../api/banking.routes";
import { ReconciliationService } from "../../application/services/reconciliation.service";

describe("banking routes / reconciliation shadow cutover", () => {
	const app = new Elysia().use(bankingRoutes);

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns cutover evaluation snapshot", async () => {
		vi.spyOn(ReconciliationService, "evaluateShadowCutover").mockResolvedValue({
			enabled: true,
			companyId: "cmp-1",
			windowRuns: 30,
			evaluatedRuns: 30,
			successfulRuns: 28,
			failedRuns: 2,
			successRate: 0.9333,
			failureRate: 0.0667,
			discrepancyRate: 0.02,
			maxAllowedDiscrepancyRate: 0.05,
			maxAllowedFailureRate: 0.1,
			minSuccessfulRuns: 20,
			decision: "GO",
			reason: "CUTOVER_GATES_PASSED",
			evaluatedAt: new Date("2026-03-20T10:00:00.000Z"),
		});

		const response = await app.handle(
			new Request(
				"http://localhost/api/banking/reconciliation-shadow/cutover?companyId=cmp-1&windowRuns=30",
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				enabled: true,
				companyId: "cmp-1",
				decision: "GO",
				reason: "CUTOVER_GATES_PASSED",
			},
		});
	});
});
