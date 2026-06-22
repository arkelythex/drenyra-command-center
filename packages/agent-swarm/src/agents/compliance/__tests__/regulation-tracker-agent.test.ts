import { describe, expect, it } from "vitest";
import { regulationTrackerAgent } from "../regulation-tracker.agent";
import type { Task } from "../../types";

function task(profile: Record<string, unknown>): Task {
	return { id: "regulation", type: "regulation", payload: { context: { tenantId: "tenant-1" }, profile } };
}

describe("regulationTrackerAgent", () => {
	it("activates SUNAT/CPE/IGV for an active Peru company", async () => {
		const result = await regulationTrackerAgent.execute(task({ country: "PE", companyActive: true, operationType: "invoice", evidenceRefs: ["ev-1"] }));
		expect(result.data.regulations.map((item) => item.id)).toEqual(expect.arrayContaining(["SUNAT", "CPE", "IGV"]));
	});

	it("activates SPOT for detraccion operations", async () => {
		const result = await regulationTrackerAgent.execute(task({ country: "PE", operationType: "detraccion", evidenceRefs: ["ev-1"], configured: ["SPOT"] }));
		expect(result.data.regulations.map((item) => item.id)).toContain("SPOT");
	});

	it("activates SIRE for monthly periods", async () => {
		const result = await regulationTrackerAgent.execute(task({ country: "PE", period: "2026-05", evidenceRefs: ["ev-1"], reports: ["SIRE"] }));
		expect(result.data.regulations.map((item) => item.id)).toContain("SIRE");
	});

	it("returns warning for unknown countries", async () => {
		const result = await regulationTrackerAgent.execute(task({ country: "UY" }));
		expect(result.success).toBe(false);
		expect(result.data.gaps).toContain("unknown_country");
	});

	it("flags cross-RUC regulation profiles", async () => {
		const result = await regulationTrackerAgent.execute({
			id: "regulation-cross-ruc",
			type: "regulation",
			payload: {
				context: { tenantId: "tenant-1", ruc: "20123456789" },
				profile: { country: "PE", ruc: "20999999999", evidenceRefs: ["ev-1"] },
			},
		});

		expect(result.success).toBe(false);
		expect(result.data.findings.some((finding) => finding.category === "scope_mismatch")).toBe(true);
	});
});
