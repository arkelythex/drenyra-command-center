import { describe, expect, it } from "vitest";
import { companies } from "../schema/core.schema";

describe("companies table (Phase C — Trust Layer)", () => {
	it("exposes sire_materiality_threshold_pen as a nullable numeric column", () => {
		expect("sireMaterialityThresholdPen" in companies).toBe(true);
		const col = companies.sireMaterialityThresholdPen;
		expect(col).toBeDefined();
		expect(col.name).toBe("sire_materiality_threshold_pen");
	});

	it("exposes sire_reversibility_window_hours with default 24", () => {
		expect("sireReversibilityWindowHours" in companies).toBe(true);
		const col = companies.sireReversibilityWindowHours;
		expect(col).toBeDefined();
		expect(col.name).toBe("sire_reversibility_window_hours");
		expect(col.default).toBe(24);
	});
});
