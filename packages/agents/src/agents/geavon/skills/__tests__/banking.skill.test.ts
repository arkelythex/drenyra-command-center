import { describe, expect, it } from "vitest";
import { bankingSkill } from "../banking.skill";

describe("bankingSkill", () => {
	it("conciliarBanco should return a banking_reconciliation artifact", async () => {
		const result = await bankingSkill.conciliarBanco("test-company", "2026-06");

		expect(result.type).toBe("banking_reconciliation");
		expect(result.id).toBeTruthy();
		expect(result.title).toContain("2026-06");
		expect(result.payload.rows).toBeInstanceOf(Array);
		expect(result.payload.summary).toBeDefined();
		expect(result.payload.summary.totalDifference).toBeTypeOf("number");
	});

	it("should handle empty reconciliation gracefully", async () => {
		const result = await bankingSkill.conciliarBanco(
			"empty-company",
			"2026-06",
		);

		expect(result.type).toBe("banking_reconciliation");
		expect(result.payload.rows).toHaveLength(0);
		expect(result.payload.summary.totalDifference).toBe(0);
	});
});
