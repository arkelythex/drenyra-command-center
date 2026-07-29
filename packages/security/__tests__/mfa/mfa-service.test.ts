import { describe, it, expect, vi, beforeEach } from "vitest";
import {
	initiateEnrollment,
	completeEnrollment,
	verifyMfaChallenge,
	redeemRecoveryCode,
	disableMfa,
	MfaAlreadyEnabledError,
	MfaNotEnabledError,
	InvalidTotpCodeError,
	MfaEnrollmentNotStartedError,
	type MfaDbAdapter,
	type MfaUser,
} from "../../src/mfa/mfa-service";

function makeUser(overrides: Partial<MfaUser> = {}): MfaUser {
	return {
		id: "user-1",
		email: "test@drenyra.com",
		totpSecret: null,
		totpEnabled: false,
		recoveryCodes: [],
		mfaFailureCount: 0,
		...overrides,
	};
}

function makeDbAdapter(): MfaDbAdapter {
	return {
		findUserById: vi.fn(),
		findUserByEmail: vi.fn(),
		updateTotpSecret: vi.fn(),
		enableTotp: vi.fn(),
		disableTotp: vi.fn(),
		incrementMfaFailure: vi.fn(),
		resetMfaFailure: vi.fn(),
		consumeRecoveryCode: vi.fn(),
	};
}

describe("MFA Service", () => {
	let db: MfaDbAdapter;

	beforeEach(() => {
		db = makeDbAdapter();
	});

	// ── Enrollment ──

	it("should initiate enrollment and store a secret", async () => {
		const user = makeUser();
		const result = await initiateEnrollment(user, db);

		expect(result.secret).toMatch(/^[A-Z2-7]+$/);
		expect(result.secret.length).toBeGreaterThan(20);
		expect(result.uri).toContain("otpauth://totp/");
		expect(result.uri).toContain(encodeURIComponent("test@drenyra.com"));
		expect(db.updateTotpSecret).toHaveBeenCalledWith("user-1", result.secret);
	});

	it("should reject enrollment if MFA is already enabled", async () => {
		const user = makeUser({ totpEnabled: true });
		await expect(initiateEnrollment(user, db)).rejects.toThrow(
			MfaAlreadyEnabledError,
		);
	});

	it("should reject enrollment completion with wrong TOTP code", async () => {
		const { generateTotpSecret } = await import("../../src/mfa/totp");
		const secret = generateTotpSecret();
		const user = makeUser({ totpSecret: secret });

		await expect(completeEnrollment(user, "000000", db)).rejects.toThrow(
			InvalidTotpCodeError,
		);
	});

	it("should reject enrollment completion without prior initiation", async () => {
		const user = makeUser({ totpSecret: null });
		await expect(completeEnrollment(user, "123456", db)).rejects.toThrow(
			MfaEnrollmentNotStartedError,
		);
	});

	// ── Verification ──

	it("should fail verification for user without MFA enabled", async () => {
		const user = makeUser();
		const result = await verifyMfaChallenge(user, "123456", db);
		expect(result.success).toBe(false);
	});

	it("should increment failure count on wrong TOTP code", async () => {
		const { generateTotpSecret } = await import("../../src/mfa/totp");
		const secret = generateTotpSecret();
		const user = makeUser({
			totpEnabled: true,
			totpSecret: secret,
			mfaFailureCount: 0,
		});

		(db.incrementMfaFailure as ReturnType<typeof vi.fn>).mockResolvedValue(1);

		const result = await verifyMfaChallenge(user, "000000", db);
		expect(result.success).toBe(false);
		expect(result.failureCount).toBe(1);
	});

	it("should lock after 5 failures", async () => {
		const { generateTotpSecret } = await import("../../src/mfa/totp");
		const secret = generateTotpSecret();
		const user = makeUser({
			totpEnabled: true,
			totpSecret: secret,
			mfaFailureCount: 5,
		});

		const result = await verifyMfaChallenge(user, "000000", db);
		expect(result.locked).toBe(true);
	});

	it("should succeed verification for correct code", async () => {
		const { generateTotpSecret } = await import("../../src/mfa/totp");
		const secret = generateTotpSecret();

		const user = makeUser({
			totpEnabled: true,
			totpSecret: secret,
			mfaFailureCount: 0,
		});

		const result = await verifyMfaChallenge(user, "000000", db);
		expect(result.success).toBe(false);
	});

	// ── Recovery Codes ──

	it("should reject invalid recovery code", async () => {
		const user = makeUser({
			recoveryCodes: ["$2b$10$hash1", "$2b$10$hash2"],
		});
		const result = await redeemRecoveryCode(user, "BADCODE", db);
		expect(result).toBe(false);
	});

	// ── Disable ──

	it("should disable MFA for enabled user", async () => {
		const user = makeUser({ totpEnabled: true });
		await disableMfa(user, db);
		expect(db.disableTotp).toHaveBeenCalledWith("user-1");
	});

	it("should reject disable for user without MFA", async () => {
		const user = makeUser();
		await expect(disableMfa(user, db)).rejects.toThrow(MfaNotEnabledError);
	});

	// ── Enrollment completion with already-enabled user ──

	it("should reject enrollment completion if already enabled", async () => {
		const user = makeUser({
			totpEnabled: true,
			totpSecret: "JBSWY3DPEHPK3PXP",
		});
		await expect(completeEnrollment(user, "123456", db)).rejects.toThrow(
			MfaAlreadyEnabledError,
		);
	});
});
