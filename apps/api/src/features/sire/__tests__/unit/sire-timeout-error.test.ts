import { describe, expect, it } from "vitest";
import { SireTimeoutError } from "../../sire-errors";

describe("SireTimeoutError", () => {
	it("is detected via instanceof check", () => {
		const error = new SireTimeoutError("SIRE API timeout after 30000ms");
		expect(error).toBeInstanceOf(SireTimeoutError);
		expect(error).toBeInstanceOf(Error);
		expect(error.code).toBe("SIRE_TIMEOUT");
		expect(error.name).toBe("SireTimeoutError");
		expect(error.message).toBe("SIRE API timeout after 30000ms");
	});

	it("is distinguishable from generic Error in a catch block", () => {
		const err1 = new Error("SIRE API request failed (500)");
		const err2 = new SireTimeoutError("SIRE API timeout after 30000ms");

		expect(err1 instanceof SireTimeoutError).toBe(false);
		expect(err2 instanceof SireTimeoutError).toBe(true);
	});
});
