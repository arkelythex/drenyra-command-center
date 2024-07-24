import { describe, expect, it } from "vitest";
import { validateSettings } from "../organization-lifecycle.controller";

describe("validateSettings", () => {
	it("accepts known settings keys", () => {
		const result = validateSettings({
			timezone: "America/Lima",
			defaultCurrency: "PEN",
			fiscalYearEnd: "12-31",
			features: ["invoicing"],
		});
		expect(result.valid).toBe(true);
		if (result.valid) {
			expect(result.data.timezone).toBe("America/Lima");
			expect(result.data.defaultCurrency).toBe("PEN");
		}
	});

	it("accepts partial settings (some keys only)", () => {
		const result = validateSettings({
			timezone: "America/Bogota",
		});
		expect(result.valid).toBe(true);
	});

	it("rejects unknown settings keys", () => {
		const result = validateSettings({
			unknownKey: "value",
		} as Record<string, unknown>);
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error).toContain("Unknown settings keys");
			expect(result.error).toContain("unknownKey");
		}
	});

	it("rejects mix of known and unknown keys", () => {
		const result = validateSettings({
			timezone: "America/Lima",
			badKey: "nope",
		} as Record<string, unknown>);
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error).toContain("badKey");
			expect(result.error).not.toContain("timezone");
		}
	});

	it("accepts empty settings object", () => {
		const result = validateSettings({});
		expect(result.valid).toBe(true);
	});
});
