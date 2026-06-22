import { describe, expect, it } from "vitest";
import { toStableUuid } from "./stable-uuid";

describe("toStableUuid", () => {
	it("returns the same UUID when input is already a UUID", () => {
		expect(toStableUuid("A0F7A3C0-1B2C-4D5E-8F90-1234567890AB")).toBe(
			"a0f7a3c0-1b2c-4d5e-8f90-1234567890ab",
		);
	});

	it("derives a deterministic UUID from a non-UUID string", () => {
		const first = toStableUuid("tx_legacy_123");
		const second = toStableUuid("tx_legacy_123");

		expect(first).toBe(second);
		expect(first).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
		);
	});
});
