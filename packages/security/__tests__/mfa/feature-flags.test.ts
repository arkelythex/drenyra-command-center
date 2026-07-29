import { describe, it, expect } from "vitest";
import { MFA_FEATURE_FLAGS } from "../../src/mfa/feature-flags";

describe("MFA Feature Flags", () => {
	it("should export TOTP_ENABLED as a boolean", () => {
		expect(typeof MFA_FEATURE_FLAGS.TOTP_ENABLED).toBe("boolean");
	});

	it("should export MFA_OPT_IN as a boolean", () => {
		expect(typeof MFA_FEATURE_FLAGS.MFA_OPT_IN).toBe("boolean");
	});

	it("should resolve TOTP_ENABLED correctly based on env", () => {
		// When TOTP_ENABLED is not explicitly "false", it should be true
		// Since CI/test env doesn't set TOTP_ENABLED=false, it defaults to true
		expect(MFA_FEATURE_FLAGS.TOTP_ENABLED).toBe(true);
	});

	it("should resolve MFA_OPT_IN correctly based on env", () => {
		// When MFA_OPT_IN is not explicitly "false", it should be true
		expect(MFA_FEATURE_FLAGS.MFA_OPT_IN).toBe(true);
	});

	it("should have frozen (readonly) flag object", () => {
		expect(() => {
			(MFA_FEATURE_FLAGS as Record<string, boolean>).TOTP_ENABLED = false;
		}).toThrow();
	});
});
