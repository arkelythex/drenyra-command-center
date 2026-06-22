/**
 * Unit Tests for DNI Value Object
 */

import { describe, expect, it } from "vitest";
import { InvalidDNIError } from "../../errors/InvalidDNIError";
import { DNI } from "../DNI";

describe("DNI Value Object", () => {
	describe("Creation", () => {
		it("should create valid DNI", () => {
			const dni = DNI.create("12345678");
			expect(dni.toString()).toBe("12345678");
		});

		it("should trim whitespace before validation", () => {
			const dni = DNI.create("  12345678  ");
			expect(dni.toString()).toBe("12345678");
		});

		it("should throw error for invalid length", () => {
			expect(() => DNI.create("1234567")).toThrow(InvalidDNIError);
			expect(() => DNI.create("123456789")).toThrow(InvalidDNIError);
		});

		it("should throw error for non-numeric characters", () => {
			expect(() => DNI.create("1234567A")).toThrow(InvalidDNIError);
			expect(() => DNI.create("ABCDEFGH")).toThrow(InvalidDNIError);
		});

		it("should throw error for empty string", () => {
			expect(() => DNI.create("")).toThrow(InvalidDNIError);
		});
	});

	describe("Formatting", () => {
		it("should format DNI with spaces", () => {
			const dni = DNI.create("12345678");
			expect(dni.format()).toBe("12 345 678");
		});
	});

	describe("Equality", () => {
		it("should be equal to DNI with same value", () => {
			const dni1 = DNI.create("12345678");
			const dni2 = DNI.create("12345678");
			expect(dni1.equals(dni2)).toBe(true);
		});

		it("should not be equal to DNI with different value", () => {
			const dni1 = DNI.create("12345678");
			const dni2 = DNI.create("87654321");
			expect(dni1.equals(dni2)).toBe(false);
		});

		it("should handle null/undefined comparison", () => {
			const dni = DNI.create("12345678");
			expect(dni.equals(null)).toBe(false);
			expect(dni.equals(undefined)).toBe(false);
		});
	});

	describe("Serialization", () => {
		it("should serialize to JSON", () => {
			const dni = DNI.create("12345678");
			const json = dni.toJSON();

			expect(json).toEqual({
				value: "12345678",
			});
		});

		it("should deserialize from JSON", () => {
			const json = { value: "12345678" };
			const dni = DNI.fromJSON(json);

			expect(dni.toString()).toBe("12345678");
		});
	});

	describe("Immutability", () => {
		it("should be immutable", () => {
			const dni = DNI.create("12345678");

			expect(() => {
				// @ts-expect-error - trying to mutate
				dni.value = "87654321";
			}).toThrow();
		});
	});

	describe("Real Examples", () => {
		const validDNIs = ["43816514", "70123456", "08765432"];

		validDNIs.forEach((dniValue) => {
			it(`should accept valid DNI: ${dniValue}`, () => {
				expect(() => DNI.create(dniValue)).not.toThrow();
			});
		});
	});
});
