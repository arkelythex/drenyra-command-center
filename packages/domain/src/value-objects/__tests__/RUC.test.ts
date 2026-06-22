/**
 * Unit Tests for RUC Value Object
 */

import { describe, expect, it } from "vitest";
import { InvalidRUCError } from "../../errors/InvalidRUCError";
import { RUC } from "../RUC";

const VALID_PERSON_RUC = "10123456781";
const VALID_COMPANY_RUC = "20123456786";
const VALID_RUCS = [
	"20100070970",
	"20100130204",
	"10123456781",
	"10123456799",
	"10123456802",
	"10123456811",
	"10123456829",
	"10123456837",
	"15123456782",
	"15123456791",
	"15123456804",
	"15123456812",
	"15123456821",
	"16123456789",
	"16123456797",
	"16123456801",
	"16123456819",
	"16123456827",
	"17123456785",
	"17123456793",
	"17123456807",
	"17123456815",
	"17123456823",
	"20123456786",
	"20123456794",
	"20123456808",
	"20123456816",
	"20123456824",
	"20123456832",
	"20123456841",
];
const INVALID_RUCS = [
	"10123456780",
	"10123456788",
	"15123456780",
	"15123456810",
	"16123456780",
	"16123456810",
	"17123456780",
	"17123456810",
	"20123456780",
	"20123456810",
];

describe("RUC Value Object", () => {
	describe("Validation", () => {
		it("should create valid RUC for natural person", () => {
			const ruc = RUC.create(VALID_PERSON_RUC);
			expect(ruc.toString()).toBe(VALID_PERSON_RUC);
			expect(ruc.getEntityType()).toBe("PERSON");
		});

		it("should create valid RUC for company", () => {
			const ruc = RUC.create(VALID_COMPANY_RUC);
			expect(ruc.toString()).toBe(VALID_COMPANY_RUC);
			expect(ruc.getEntityType()).toBe("COMPANY");
		});

		it("should throw error for RUC with invalid length", () => {
			expect(() => RUC.create("123456789")).toThrow(InvalidRUCError);
			expect(() => RUC.create("123456789012")).toThrow(InvalidRUCError);
		});

		it("should throw error for RUC with non-numeric characters", () => {
			expect(() => RUC.create("1012345678A")).toThrow(InvalidRUCError);
		});

		it("should throw error for RUC with invalid check digit", () => {
			expect(() => RUC.create("10123456780")).toThrow(InvalidRUCError);
		});

		it("should reject unsupported RUC prefixes even when checksum is valid", () => {
			expect(() => RUC.create("00000000001")).toThrow(InvalidRUCError);
		});

		it("should support SUNAT modulo 11 check digit 0 edge case", () => {
			const ruc = RUC.create("10000000090");

			expect(ruc.getCheckDigit()).toBe(0);
			expect(ruc.getEntityType()).toBe("PERSON");
		});

		it("should trim whitespace before validation", () => {
			const ruc = RUC.create(`  ${VALID_PERSON_RUC}  `);
			expect(ruc.toString()).toBe(VALID_PERSON_RUC);
		});
	});

	describe("Modulo 11 Validation", () => {
		VALID_RUCS.forEach((rucValue) => {
			it(`should validate real RUC: ${rucValue}`, () => {
				expect(() => RUC.create(rucValue)).not.toThrow();
			});
		});

		INVALID_RUCS.forEach((rucValue) => {
			it(`should reject invalid checksum: ${rucValue}`, () => {
				expect(() => RUC.create(rucValue)).toThrow(InvalidRUCError);
			});
		});
	});

	describe("Entity Type Detection", () => {
		it("should detect natural person (starts with 10)", () => {
			const ruc = RUC.create(VALID_PERSON_RUC);
			expect(ruc.isPerson()).toBe(true);
			expect(ruc.isCompany()).toBe(false);
		});

		it("should detect legal entity (starts with 20)", () => {
			const ruc = RUC.create(VALID_COMPANY_RUC);
			expect(ruc.isPerson()).toBe(false);
			expect(ruc.isCompany()).toBe(true);
		});
	});

	describe("Formatting", () => {
		it("should format RUC with dashes", () => {
			const ruc = RUC.create(VALID_COMPANY_RUC);
			expect(ruc.format()).toBe("20-12345678-6");
		});
	});

	describe("Equality", () => {
		it("should be equal to RUC with same value", () => {
			const ruc1 = RUC.create(VALID_COMPANY_RUC);
			const ruc2 = RUC.create(VALID_COMPANY_RUC);
			expect(ruc1.equals(ruc2)).toBe(true);
		});

		it("should not be equal to RUC with different value", () => {
			const ruc1 = RUC.create(VALID_COMPANY_RUC);
			const ruc2 = RUC.create("20100070970");
			expect(ruc1.equals(ruc2)).toBe(false);
		});

		it("should handle null/undefined comparison", () => {
			const ruc = RUC.create(VALID_COMPANY_RUC);
			expect(ruc.equals(null)).toBe(false);
			expect(ruc.equals(undefined)).toBe(false);
		});
	});

	describe("Immutability", () => {
		it("should be immutable", () => {
			const ruc = RUC.create(VALID_COMPANY_RUC);

			expect(() => {
				// @ts-expect-error - trying to mutate
				ruc.value = "20100070970";
			}).toThrow();
		});
	});

	describe("Components", () => {
		it("should extract base (first 10 digits)", () => {
			const ruc = RUC.create(VALID_COMPANY_RUC);
			expect(ruc.getBase()).toBe("2012345678");
		});

		it("should extract check digit", () => {
			const ruc = RUC.create(VALID_COMPANY_RUC);
			expect(ruc.getCheckDigit()).toBe(6);
		});
	});
});
