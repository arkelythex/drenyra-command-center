import { describe, it, expect } from "bun:test";
import {
	generateTotpSecret,
	generateTotpUri,
	verifyTotp,
} from "../../src/mfa/totp";

describe("TOTP", () => {
	it("should generate a base32 secret", () => {
		const secret = generateTotpSecret();
		expect(secret.length).toBeGreaterThan(20);
		expect(secret).toMatch(/^[A-Z2-7]+$/);
	});

	it("should generate a valid otpauth URI", () => {
		const secret = generateTotpSecret();
		const uri = generateTotpUri(secret, "test@drenyra.com");
		expect(uri).toContain("otpauth://totp/");
		expect(uri).toContain("secret=");
		expect(uri).toContain("issuer=Drenyra");
	});

	it("should reject an invalid TOTP code", () => {
		const secret = generateTotpSecret();
		expect(verifyTotp(secret, "000000")).toBe(false);
	});

	it("should reject non-numeric codes", () => {
		const secret = generateTotpSecret();
		expect(verifyTotp(secret, "abcdef")).toBe(false);
	});

	it("should reject empty codes", () => {
		const secret = generateTotpSecret();
		expect(verifyTotp(secret, "")).toBe(false);
	});
});
