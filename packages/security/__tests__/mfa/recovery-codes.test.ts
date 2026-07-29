import { describe, it, expect } from "vitest";
import {
	generateRecoveryCodes,
	hashRecoveryCode,
	verifyRecoveryCode,
} from "../../src/mfa/recovery-codes";

describe("Recovery Codes", () => {
	it("should generate exactly 8 recovery codes", () => {
		const codes = generateRecoveryCodes();
		expect(codes).toHaveLength(8);
	});

	it("should generate unique codes", () => {
		const codes = generateRecoveryCodes();
		const unique = new Set(codes);
		expect(unique.size).toBe(8);
	});

	it("should generate codes of length 10", () => {
		const codes = generateRecoveryCodes();
		for (const code of codes) {
			expect(code.length).toBe(10);
		}
	});

	it("should generate codes with only allowed characters (no I,O,0,1)", () => {
		const codes = generateRecoveryCodes();
		const invalidChars = /[IO01]/;
		for (const code of codes) {
			expect(code).not.toMatch(invalidChars);
		}
	});

	it("should hash a recovery code", async () => {
		const code = "A1B2C3D4E5";
		const hash = await hashRecoveryCode(code);
		// bcrypt hashes start with $2b$ or $2a$
		expect(hash).toMatch(/^\$2[ab]\$\d{2}\$/);
	});

	it("should produce different hashes for different codes", async () => {
		const hash1 = await hashRecoveryCode("A1B2C3D4E5");
		const hash2 = await hashRecoveryCode("F6G7H8I9J0");
		expect(hash1).not.toBe(hash2);
	});

	it("should verify a recovery code against stored hashes", async () => {
		const plaintextCodes = generateRecoveryCodes();
		const hashes: (string | null)[] = [];
		for (const code of plaintextCodes) {
			hashes.push(await hashRecoveryCode(code));
		}

		// Test matching against each code
		for (let i = 0; i < plaintextCodes.length; i++) {
			const index = await verifyRecoveryCode(plaintextCodes[i]!, hashes);
			expect(index).toBe(i);
		}
	});

	it("should return -1 for an invalid recovery code", async () => {
		const plaintextCodes = generateRecoveryCodes();
		const hashes: (string | null)[] = [];
		for (const code of plaintextCodes) {
			hashes.push(await hashRecoveryCode(code));
		}

		const index = await verifyRecoveryCode("INVALID000", hashes);
		expect(index).toBe(-1);
	});

	it("should skip null entries (consumed codes)", async () => {
		const plaintextCodes = generateRecoveryCodes();
		const hashes: (string | null)[] = [];
		for (const code of plaintextCodes) {
			hashes.push(await hashRecoveryCode(code));
		}

		// Mark index 2 as consumed
		hashes[2] = null;

		// Code at index 2 should not be found
		const index = await verifyRecoveryCode(plaintextCodes[2]!, hashes);
		expect(index).toBe(-1);

		// Code at index 3 should still be found
		const index3 = await verifyRecoveryCode(plaintextCodes[3]!, hashes);
		expect(index3).toBe(3);
	});
});
