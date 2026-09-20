import { describe, expect, it } from "vitest";
import { createDrenyraGateValidator } from "../drenyra-gate-validator";

const validator = createDrenyraGateValidator({
	skillRefs: ["pe.igv-validate@1.0.0"],
});

describe("createDrenyraGateValidator", () => {
	it("allows R1 reversible low-value operations (controlled autonomy)", async () => {
		const result = await validator("post-journal", {
			amountCents: "120000",
			reversibility: "reversible",
			jurisdiction: "PE",
		});
		expect(result.valid).toBe(true);
		expect(result.reasons).toEqual([]);
		expect(result.evidenceRefs).toContain("pe.igv-validate@1.0.0");
	});

	it("requires human approval for R3 irreversible operations", async () => {
		const result = await validator("file-declaration", {
			amountCents: "500000000",
			reversibility: "irreversible",
			jurisdiction: "PE",
		});
		expect(result.valid).toBe(false);
		expect(result.reasons.some((r) => r.includes("approval"))).toBe(true);
	});

	it("accepts R3 with two distinct approvals recorded", async () => {
		const result = await validator("file-declaration", {
			amountCents: "500000000",
			reversibility: "irreversible",
			jurisdiction: "PE",
			approvals: [
				{ approverId: "alicia", at: "2026-08-01T00:00:00.000Z" },
				{ approverId: "beto", at: "2026-08-01T01:00:00.000Z" },
			],
		});
		expect(result.valid).toBe(true);
	});

	it("fails closed on an unparseable amount", async () => {
		const result = await validator("post-journal", {
			amountCents: "not-a-number",
		});
		expect(result.valid).toBe(false);
		expect(result.reasons[0]).toContain("amountCents");
	});
});
