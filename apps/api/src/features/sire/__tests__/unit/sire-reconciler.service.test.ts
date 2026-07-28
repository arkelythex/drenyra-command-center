import { describe, expect, it } from "vitest";
import { SireReconcilerService } from "../../services/sire-reconciler.service";

describe("SireReconcilerService", () => {
	describe("reconcileUnknown", () => {
		// D.3.1 RED: SUNAT confirms → COMPLETED
		it("transitions to COMPLETED when SUNAT confirms receipt (ACEPTADO)", async () => {
			const result = await SireReconcilerService.reconcileUnknown(
				"sub-1",
				// Mock SUNAT response: accepted
				{ status: "ACEPTADO", ticket: "TICK-99" },
			);

			expect(result.status).toBe("COMPLETED");
		});

		// D.3.3 RED: SUNAT has no record → FAILED_RETRYABLE
		it("transitions to FAILED_RETRYABLE when SUNAT has no record", async () => {
			const result = await SireReconcilerService.reconcileUnknown(
				"sub-2",
				// Mock SUNAT response: not found
				{ status: "NOT_FOUND", message: "No submission found for trackingId" },
			);

			expect(result.status).toBe("FAILED_RETRYABLE");
		});

		// D.3.5 RED: SUNAT 503 → stays RECONCILING with backoff
		it("stays in RECONCILING when SUNAT API returns 503", async () => {
			const result = await SireReconcilerService.reconcileUnknown(
				"sub-3",
				// Mock SUNAT response: service unavailable
				{ status: "SERVICE_UNAVAILABLE", retryAfter: 120 },
			);

			expect(result.status).toBe("RECONCILING");
			expect(result.nextRetryAt).toBeDefined();
			expect(result.nextRetryAt!.getTime()).toBeGreaterThan(Date.now());
		});
	});

	describe("determineReconciliationStatus", () => {
		it('returns COMPLETED for "ACEPTADO"', () => {
			expect(
				SireReconcilerService.determineReconciliationStatus({
					status: "ACEPTADO",
				}),
			).toBe("COMPLETED");
		});

		it('returns COMPLETED for "ACCEPTED"', () => {
			expect(
				SireReconcilerService.determineReconciliationStatus({
					status: "ACCEPTED",
				}),
			).toBe("COMPLETED");
		});

		it('returns FAILED_RETRYABLE for "NOT_FOUND"', () => {
			expect(
				SireReconcilerService.determineReconciliationStatus({
					status: "NOT_FOUND",
				}),
			).toBe("FAILED_RETRYABLE");
		});

		it('returns RECONCILING for "SERVICE_UNAVAILABLE"', () => {
			expect(
				SireReconcilerService.determineReconciliationStatus({
					status: "SERVICE_UNAVAILABLE",
				}),
			).toBe("RECONCILING");
		});
	});

	describe("computeBackoff", () => {
		it("computes exponential backoff based on attempt number", () => {
			// 2^1 = 2 minutes = 120000ms
			const delay1 = SireReconcilerService.computeBackoff(1);
			expect(delay1).toBe(2 * 60 * 1000);

			// 2^3 = 8 minutes = 480000ms
			const delay3 = SireReconcilerService.computeBackoff(3);
			expect(delay3).toBe(8 * 60 * 1000);
		});

		it("caps at max backoff", () => {
			// 2^10 = 1024 minutes, but capped at 60 min
			const delay = SireReconcilerService.computeBackoff(10);
			expect(delay).toBeLessThanOrEqual(60 * 60 * 1000);
		});
	});
});
