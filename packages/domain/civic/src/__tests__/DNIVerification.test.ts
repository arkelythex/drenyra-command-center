/**
 * Unit Tests for DNIVerification Value Object
 */

import { DNI } from "@arkelythex/domain";
import { describe, expect, it } from "vitest";
import {
	DNIVerification,
	DNIVerificationStatus,
} from "../value-object/DNIVerification";

describe("DNIVerification Value Object", () => {
	const validDNI = DNI.create("12345678");
	const verifierId = "verifier-001";

	describe("Creation", () => {
		it("should create with PENDING status", () => {
			const verification = DNIVerification.create(validDNI);
			expect(verification.dni.equals(validDNI)).toBe(true);
			expect(verification.verificationStatus).toBe(
				DNIVerificationStatus.PENDING,
			);
			expect(verification.verifiedAt).toBeUndefined();
			expect(verification.verifierId).toBeUndefined();
		});

		it("should create VERIFIED with verified() factory", () => {
			const verification = DNIVerification.verified(validDNI, verifierId);
			expect(verification.verificationStatus).toBe(
				DNIVerificationStatus.VERIFIED,
			);
			expect(verification.verifierId).toBe(verifierId);
			expect(verification.verifiedAt).toBeInstanceOf(Date);
		});

		it("should create NOT_FOUND with notFound() factory", () => {
			const verification = DNIVerification.notFound(validDNI);
			expect(verification.verificationStatus).toBe(
				DNIVerificationStatus.NOT_FOUND,
			);
			expect(verification.verifiedAt).toBeUndefined();
			expect(verification.verifierId).toBeUndefined();
		});
	});

	describe("State Transitions", () => {
		it("should transition from PENDING to VERIFIED via markVerified", () => {
			const verification = DNIVerification.create(validDNI);
			const verified = verification.markVerified(verifierId);

			expect(verified.verificationStatus).toBe(DNIVerificationStatus.VERIFIED);
			expect(verified.verifierId).toBe(verifierId);
			expect(verified.verifiedAt).toBeInstanceOf(Date);
			expect(verification.verificationStatus).toBe(
				DNIVerificationStatus.PENDING,
			);
		});

		it("should transition from PENDING to UNVERIFIED via markUnverified", () => {
			const verification = DNIVerification.create(validDNI);
			const unverified = verification.markUnverified();

			expect(unverified.verificationStatus).toBe(
				DNIVerificationStatus.UNVERIFIED,
			);
			expect(unverified.verifiedAt).toBeUndefined();
			expect(unverified.verifierId).toBeUndefined();
			expect(verification.verificationStatus).toBe(
				DNIVerificationStatus.PENDING,
			);
		});

		it("should transition from VERIFIED to UNVERIFIED via markUnverified", () => {
			const verification = DNIVerification.verified(validDNI, verifierId);
			const unverified = verification.markUnverified();

			expect(unverified.verificationStatus).toBe(
				DNIVerificationStatus.UNVERIFIED,
			);
			expect(unverified.verifiedAt).toBeUndefined();
			expect(unverified.verifierId).toBeUndefined();
		});

		it("should transition from NOT_FOUND to VERIFIED via markVerified", () => {
			const verification = DNIVerification.notFound(validDNI);
			const verified = verification.markVerified(verifierId);

			expect(verified.verificationStatus).toBe(DNIVerificationStatus.VERIFIED);
			expect(verified.verifierId).toBe(verifierId);
		});
	});

	describe("Equality", () => {
		it("should be equal when same DNI and status", () => {
			const v1 = DNIVerification.create(validDNI);
			const v2 = DNIVerification.create(validDNI);
			expect(v1.equals(v2)).toBe(true);
		});

		it("should not be equal when different status", () => {
			const v1 = DNIVerification.create(validDNI);
			const v2 = DNIVerification.verified(validDNI, verifierId);
			expect(v1.equals(v2)).toBe(false);
		});

		it("should not be equal when different DNI", () => {
			const v1 = DNIVerification.create(validDNI);
			const v2 = DNIVerification.create(DNI.create("87654321"));
			expect(v1.equals(v2)).toBe(false);
		});

		it("should handle null/undefined comparison", () => {
			const v = DNIVerification.create(validDNI);
			expect(v.equals(null)).toBe(false);
			expect(v.equals(undefined)).toBe(false);
		});
	});

	describe("Serialization", () => {
		it("should serialize PENDING to JSON", () => {
			const verification = DNIVerification.create(validDNI);
			const json = verification.toJSON();

			expect(json).toEqual({
				dni: { value: "12345678" },
				verificationStatus: DNIVerificationStatus.PENDING,
			});
		});

		it("should serialize VERIFIED to JSON", () => {
			const verification = DNIVerification.verified(validDNI, verifierId);
			const json = verification.toJSON();

			expect(json).toMatchObject({
				dni: { value: "12345678" },
				verificationStatus: DNIVerificationStatus.VERIFIED,
				verifierId,
			});
			expect(json.verifiedAt).toBeDefined();
			expect(typeof json.verifiedAt).toBe("string");
		});

		it("should serialize NOT_FOUND to JSON", () => {
			const verification = DNIVerification.notFound(validDNI);
			const json = verification.toJSON();

			expect(json).toEqual({
				dni: { value: "12345678" },
				verificationStatus: DNIVerificationStatus.NOT_FOUND,
			});
		});
	});

	describe("Checksum Validation", () => {
		it("should return true for DNI with valid checksum", () => {
			const result = DNIVerification.validateChecksum("12345678");
			expect(result).toBe(true);
		});

		it("should return false for DNI with invalid checksum (all zeros)", () => {
			const result = DNIVerification.validateChecksum("00000000");
			expect(result).toBe(false);
		});

		it("should return false for non-8-digit input", () => {
			expect(DNIVerification.validateChecksum("1234567")).toBe(false);
			expect(DNIVerification.validateChecksum("123456789")).toBe(false);
		});

		it("should return false for non-numeric input", () => {
			expect(DNIVerification.validateChecksum("1234567A")).toBe(false);
		});
	});

	describe("Immutability", () => {
		it("should be frozen", () => {
			const verification = DNIVerification.create(validDNI);

			expect(() => {
				// @ts-expect-error - trying to mutate frozen object
				verification.verificationStatus = DNIVerificationStatus.VERIFIED;
			}).toThrow();
		});
	});
});
