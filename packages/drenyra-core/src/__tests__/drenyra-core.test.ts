import { describe, expect, it } from "vitest";
import { DRENYRA_SUBAGENTS } from "../types";

describe("DRENYRA_SUBAGENTS", () => {
	it("should have exactly 8 subagents", () => {
		expect(DRENYRA_SUBAGENTS).toHaveLength(8);
	});

	it("should have unique ids for every subagent", () => {
		const ids = DRENYRA_SUBAGENTS.map((a) => a.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it.each(DRENYRA_SUBAGENTS)(
		"should have all required fields for $id",
		(subagent) => {
			expect(subagent.id).toBeTruthy();
			expect(typeof subagent.id).toBe("string");

			expect(subagent.name).toBeTruthy();
			expect(typeof subagent.name).toBe("string");

			expect(subagent.role).toBeTruthy();
			expect(typeof subagent.role).toBe("string");

			expect(subagent.description).toBeTruthy();
			expect(typeof subagent.description).toBe("string");
		},
	);

	it("should have non-empty names for every subagent", () => {
		for (const agent of DRENYRA_SUBAGENTS) {
			expect(agent.name.length).toBeGreaterThan(0);
		}
	});

	it("should match the canonical 8-agent contract", () => {
		const expectedIds = [
			"eviden",
			"vigila",
			"traza",
			"regula",
			"revela",
			"funde",
			"reporta",
			"archiva",
		];
		const actualIds = DRENYRA_SUBAGENTS.map((a) => a.id);
		expect(actualIds).toEqual(expectedIds);
	});
});
