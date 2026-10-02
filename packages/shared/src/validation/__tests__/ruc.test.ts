/**
 * RUC Validation Tests
 *
 * Tests for the isValidRUC function implementing SUNAT Módulo 11 algorithm.
 * Note: Valid RUCs were calculated using the correct SUNAT algorithm.
 */

import { describe, expect, it } from "vitest";
import { isNumericString, isValidRUC } from "../ruc";

describe("isValidRUC", () => {
	describe("valid RUCs", () => {
		it("should accept valid company RUC (20 prefix, check digit 6)", () => {
			expect(isValidRUC("20123456786")).toBe(true);
		});

		it("should accept valid company RUC (20 prefix, check digit 3)", () => {
			expect(isValidRUC("20492928373")).toBe(true);
		});

		it("should accept valid company RUC (20 prefix, check digit 4)", () => {
			expect(isValidRUC("20546296564")).toBe(true);
		});

		it("should accept valid company RUC (20 prefix, check digit 1)", () => {
			expect(isValidRUC("20602634371")).toBe(true);
		});

		it("should accept valid person RUC (10 prefix, check digit 1)", () => {
			expect(isValidRUC("10123456781")).toBe(true);
		});

		it("should accept valid person RUC (10 prefix, check digit 9)", () => {
			expect(isValidRUC("10456789019")).toBe(true);
		});

		it("should accept valid government RUC (15 prefix, check digit 2)", () => {
			expect(isValidRUC("15123456782")).toBe(true);
		});
	});

	describe("invalid RUCs - wrong check digit", () => {
		it("should reject RUC with wrong check digit (9 instead of 6)", () => {
			expect(isValidRUC("20123456789")).toBe(false);
		});

		it("should reject RUC with digit transposed", () => {
			expect(isValidRUC("20123456780")).toBe(false);
		});

		it("should reject random 11-digit number", () => {
			expect(isValidRUC("12345678901")).toBe(false);
		});

		it("should reject valid format with wrong check", () => {
			expect(isValidRUC("20492928374")).toBe(false);
		});
	});

	describe("invalid RUCs - format issues", () => {
		it("should reject RUC with only 10 digits", () => {
			expect(isValidRUC("1234567890")).toBe(false);
		});

		it("should reject RUC with only 9 digits", () => {
			expect(isValidRUC("123456789")).toBe(false);
		});

		it("should reject RUC with 12 digits", () => {
			expect(isValidRUC("201234567890")).toBe(false);
		});

		it("should reject empty string", () => {
			expect(isValidRUC("")).toBe(false);
		});

		it("should reject RUC with non-numeric characters", () => {
			expect(isValidRUC("2012345678A")).toBe(false);
		});

		it("should reject RUC with spaces", () => {
			expect(isValidRUC("201234567 9")).toBe(false);
		});

		it("should reject RUC with special characters", () => {
			expect(isValidRUC("201234567-9")).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("should reject RUC with all zeros", () => {
			expect(isValidRUC("00000000000")).toBe(false);
		});

		it("should accept RUC with leading zeros but valid check digit", () => {
			// sum = 1, remainder = 1, expected = 11 -> 1, actual = 1 (mathematically valid per SUNAT)
			expect(isValidRUC("00000000001")).toBe(true);
		});

		it("should reject RUC with single digit repeated", () => {
			expect(isValidRUC("11111111111")).toBe(false);
		});

		it("should reject RUC with alternating pattern", () => {
			expect(isValidRUC("12121212121")).toBe(false);
		});
	});
});

describe("isNumericString", () => {
	it("should return true for numeric-only string", () => {
		expect(isNumericString("12345678901")).toBe(true);
	});

	it("should return false for string with letters", () => {
		expect(isNumericString("1234567890A")).toBe(false);
	});

	it("should return false for empty string", () => {
		expect(isNumericString("")).toBe(false);
	});

	it("should return false for string with spaces", () => {
		expect(isNumericString("123456789 1")).toBe(false);
	});

	it("should return false for string with special characters", () => {
		expect(isNumericString("123456789!")).toBe(false);
	});
});

describe("isValidRUC - Módulo 11 special cases and weights", () => {
	it("maps expected check digit 10 to 0", () => {
		expect(isValidRUC("20123450010")).toBe(true);
		expect(isValidRUC("20123450011")).toBe(false);
	});

	it("maps expected check digit 11 to 1", () => {
		expect(isValidRUC("20123450061")).toBe(true);
		expect(isValidRUC("20123450060")).toBe(false);
	});

	it.each(["20123456786", "20492928373", "20123450010", "20123450061"])(
		"rejects %s when any one of the first 10 digits changes by one",
		(valid) => {
			for (let i = 0; i < 10; i++) {
				const digit = Number(valid[i]);
				const changed = `${valid.slice(0, i)}${(digit + 1) % 10}${valid.slice(i + 1)}`;
				expect(isValidRUC(changed), `position ${i}`).toBe(false);
			}
		},
	);
});
