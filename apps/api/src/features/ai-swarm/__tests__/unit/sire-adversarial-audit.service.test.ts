import { describe, expect, it } from "vitest";
import { SireAdversarialAuditService } from "../../workflows/sire-adversarial-audit.service";

const service = new SireAdversarialAuditService();

describe("SireAdversarialAuditService", () => {
	it("approves when checks are aligned and no hard blockers exist", async () => {
		const result = await service.run({
			companyId: "cmp-ok",
			ruc: "20100070970",
			period: "2026-07",
			declaredIgvPen: 180,
			salesTotalPen: 1000,
			rvieRecords: 12,
			rceRecords: 7,
			pleSalesRecords: 12,
			plePurchaseRecords: 7,
		});

		expect(result.readinessStatus).toBe("ready");
		expect(result.anomalies).toHaveLength(0);
		expect(result.arbiter.decision).toBe("approved");
		expect(result.arbiter.shouldTriggerAlert).toBe(false);
	});

	it("rejects when destructor detects critical IGV breach", async () => {
		const result = await service.run({
			companyId: "cmp-bad-igv",
			ruc: "20100070970",
			period: "2026-07",
			declaredIgvPen: 0,
			salesTotalPen: 5000,
			rvieRecords: 30,
			rceRecords: 25,
			pleSalesRecords: 30,
			plePurchaseRecords: 25,
		});

		expect(result.readinessStatus).toBe("blocked");
		expect(result.destructor.severity).toBe("critical");
		expect(result.arbiter.decision).toBe("rejected");
		expect(result.arbiter.shouldTriggerAlert).toBe(true);
	});

	it("moves to manual review when dynamic FP threshold rises", async () => {
		const result = await service.run({
			companyId: "cmp-fp",
			ruc: "20100070970",
			period: "2026-04",
			declaredIgvPen: 180,
			salesTotalPen: 1000,
			rvieRecords: 15,
			rceRecords: 11,
			pleSalesRecords: 15,
			plePurchaseRecords: 11,
			falsePositiveRate: 0.25,
		});

		expect(result.destructor.severity).toBe("medium");
		expect(result.arbiter.dynamicAdjustment).toBeGreaterThan(0);
		expect(result.arbiter.decision).toBe("manual_review");
	});
});
