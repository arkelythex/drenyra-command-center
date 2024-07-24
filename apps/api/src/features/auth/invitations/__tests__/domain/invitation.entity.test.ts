/**
 * Domain unit tests: Invitation entity + validation functions.
 *
 * RED phase — these tests reference code that does NOT exist yet.
 * All imports will fail until Phase 1B (GREEN) implementation.
 *
 * @module invitations/__tests__/domain
 */

import { describe, expect, it } from "vitest";

// RED: imports target code that does not exist yet
import {
	generateInvitationToken,
	isExpired,
	isInvitableRole,
	isValidInvitationRole,
	isValidStatusTransition,
	normalizeEmail,
} from "../../domain/invitation.entity";
import type { InvitationStatus } from "../../domain/invitation.entity";

// ============================================================
// normalizeEmail
// ============================================================

describe("normalizeEmail", () => {
	it("trims whitespace", () => {
		expect(normalizeEmail("  user@example.com  ")).toBe("user@example.com");
	});

	it("lowercases mixed-case email", () => {
		expect(normalizeEmail("User@Example.COM")).toBe("user@example.com");
	});

	it("handles already-normalized email (idempotency)", () => {
		expect(normalizeEmail("user@example.com")).toBe("user@example.com");
	});

	it("trims and lowercases simultaneously", () => {
		expect(normalizeEmail("  Admin@Firm.COM  ")).toBe("admin@firm.com");
	});

	it("handles empty string", () => {
		expect(normalizeEmail("")).toBe("");
	});

	it("handles whitespace-only string", () => {
		expect(normalizeEmail("   ")).toBe("");
	});

	it("handles non-ASCII characters (preserves unicode in local part)", () => {
		expect(normalizeEmail("José@Example.COM")).toBe("josé@example.com");
	});
});

// ============================================================
// isValidInvitationRole
// ============================================================

describe("isValidInvitationRole", () => {
	it("accepts ADMIN", () => {
		expect(isValidInvitationRole("ADMIN")).toBe(true);
	});

	it("accepts ACCOUNTANT", () => {
		expect(isValidInvitationRole("ACCOUNTANT")).toBe(true);
	});

	it("accepts REVIEWER", () => {
		expect(isValidInvitationRole("REVIEWER")).toBe(true);
	});

	it("accepts APPROVER", () => {
		expect(isValidInvitationRole("APPROVER")).toBe(true);
	});

	it("accepts VIEWER", () => {
		expect(isValidInvitationRole("VIEWER")).toBe(true);
	});

	it("accepts OWNER (validation only — isInvitableRole blocks OWNER)", () => {
		expect(isValidInvitationRole("OWNER")).toBe(true);
	});

	it("rejects invalid role string", () => {
		expect(isValidInvitationRole("SUPER_ADMIN")).toBe(false);
	});

	it("rejects empty string", () => {
		expect(isValidInvitationRole("")).toBe(false);
	});

	it("rejects lowercase variant of valid role", () => {
		expect(isValidInvitationRole("admin")).toBe(false);
	});
});

// ============================================================
// isInvitableRole
// ============================================================

describe("isInvitableRole", () => {
	it("accepts ADMIN", () => {
		expect(isInvitableRole("ADMIN")).toBe(true);
	});

	it("accepts ACCOUNTANT", () => {
		expect(isInvitableRole("ACCOUNTANT")).toBe(true);
	});

	it("accepts REVIEWER", () => {
		expect(isInvitableRole("REVIEWER")).toBe(true);
	});

	it("accepts APPROVER", () => {
		expect(isInvitableRole("APPROVER")).toBe(true);
	});

	it("accepts VIEWER", () => {
		expect(isInvitableRole("VIEWER")).toBe(true);
	});

	it("rejects OWNER — cannot invite OWNER role", () => {
		expect(isInvitableRole("OWNER")).toBe(false);
	});
});

// ============================================================
// isExpired
// ============================================================

describe("isExpired", () => {
	it("returns true for a past date", () => {
		const past = new Date("2020-01-01T00:00:00Z");
		expect(isExpired(past)).toBe(true);
	});

	it("returns false for a future date", () => {
		const future = new Date("2099-12-31T23:59:59Z");
		expect(isExpired(future)).toBe(false);
	});

	it("returns true for a date exactly at the current millisecond", () => {
		const now = new Date();
		expect(isExpired(now)).toBe(true);
	});

	it("returns true for a date one millisecond in the past", () => {
		const justPast = new Date(Date.now() - 1);
		expect(isExpired(justPast)).toBe(true);
	});

	it("returns false for a date one millisecond in the future", () => {
		const justFuture = new Date(Date.now() + 1);
		expect(isExpired(justFuture)).toBe(false);
	});

	it("handles Date objects created via different constructors", () => {
		const past1 = new Date("2024-01-01");
		const past2 = new Date(2024, 0, 1);
		expect(isExpired(past1)).toBe(true);
		expect(isExpired(past2)).toBe(true);
	});
});

// ============================================================
// generateInvitationToken
// ============================================================

describe("generateInvitationToken", () => {
	it("returns a string", () => {
		const token = generateInvitationToken();
		expect(typeof token).toBe("string");
	});

	it("returns a non-empty string", () => {
		const token = generateInvitationToken();
		expect(token.length).toBeGreaterThan(0);
	});

	it("returns a valid UUID v4 format (36 chars, 4 hyphens)", () => {
		const token = generateInvitationToken();
		// UUID v4: 8-4-4-4-12 hex chars
		const uuidV4Regex =
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		expect(uuidV4Regex.test(token)).toBe(true);
	});

	it("generates unique tokens on successive calls", () => {
		const tokens = new Set<string>();
		for (let i = 0; i < 100; i++) {
			tokens.add(generateInvitationToken());
		}
		expect(tokens.size).toBe(100);
	});
});

// ============================================================
// isValidStatusTransition
// ============================================================

describe("isValidStatusTransition", () => {
	// ── Valid transitions from 'pending' ──

	const pendingTransitions: [InvitationStatus, boolean][] = [
		["pending", false],
		["accepted", true],
		["rejected", true],
		["expired", true],
		["cancelled", true],
	];

	for (const [target, expected] of pendingTransitions) {
		const label = expected ? "allows" : "rejects";
		it(`${label} pending → ${target}`, () => {
			expect(isValidStatusTransition("pending", target)).toBe(expected);
		});
	}

	// ── All terminal states reject any transition ──

	const terminalStates: InvitationStatus[] = [
		"accepted",
		"rejected",
		"expired",
		"cancelled",
	];

	for (const source of terminalStates) {
		for (const target of ["pending", "accepted", "rejected", "expired", "cancelled"] as InvitationStatus[]) {
			it(`rejects ${source} → ${target} (terminal state)`, () => {
				expect(isValidStatusTransition(source, target)).toBe(false);
			});
		}
	}

	// ── Invalid source status ──

	it("rejects transition from unknown source status", () => {
		expect(
			isValidStatusTransition("unknown" as InvitationStatus, "accepted"),
		).toBe(false);
	});

	it("rejects transition to unknown target status", () => {
		expect(
			isValidStatusTransition("pending", "unknown" as InvitationStatus),
		).toBe(false);
	});
});
