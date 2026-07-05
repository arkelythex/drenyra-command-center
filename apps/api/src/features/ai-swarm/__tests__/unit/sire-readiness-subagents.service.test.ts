import { describe, expect, it } from "vitest";
import { SireReadinessSubagentsService } from "../../workflows/sire-readiness-subagents.service";

describe("SireReadinessSubagentsService", () => {
	it("returns ready when IGV and RVIE/RCE are aligned", async () => {
		const service = new SireReadinessSubagentsService();
		const result = await service.run({
			companyId: "cmp-1",
			period: "2026-06",
			declaredIgvPen: 180,
			salesTotalPen: 1000,
			rvieRecords: 12,
			rceRecords: 7,
			pleSalesRecords: 12,
			plePurchaseRecords: 7,
		});

		expect(result.status).toBe("ready");
		expect(result.execution.mode).toBe("parallel-subagents");
		expect(result.checks).toHaveLength(2);
	});

	it("returns blocked when IGV gap exceeds tolerance", async () => {
		const service = new SireReadinessSubagentsService();
		const result = await service.run({
			companyId: "cmp-2",
			period: "2026-06",
			declaredIgvPen: 120,
			salesTotalPen: 1000,
			rvieRecords: 8,
			rceRecords: 4,
			pleSalesRecords: 8,
			plePurchaseRecords: 4,
		});

		expect(result.status).toBe("blocked");
		const igvCheck = result.checks.find(
			(check) => check.subagent === "igv-subagent",
		);
		expect(igvCheck?.status).toBe("fail");
	});
});
