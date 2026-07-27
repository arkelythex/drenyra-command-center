/**
 * ReconciliationBatch Entity Tests — RED phase
 *
 * Tests for the ReconciliationBatch aggregate root.
 * These tests MUST FAIL until the entity is implemented.
 */

import { describe, expect, it } from "vitest";
import { Money } from "../../value-objects/Money";

// ---------------------------------------------------------------------------
// ReconciliationBatch is imported from its future location.
// This import WILL FAIL (file doesn't exist yet) — that's the RED phase.
// ---------------------------------------------------------------------------
import {
	ReconciliationBatch,
	type ReconciliationMode,
} from "../ReconciliationBatch";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeMoney = (amount: number, currency: "PEN" | "USD" = "PEN"): Money =>
	Money.fromAmount(amount, currency);

    const createValidBatch = (
	overrides: Partial<{
		companyId: string;
		bankAccountId: string;
		periodStart: Date;
		periodEnd: Date;
		openingBalance: Money;
		mode: ReconciliationMode;
	}> = {},
    ): ReconciliationBatch => {
	return ReconciliationBatch.createNew({
		companyId: overrides.companyId ?? "cmp-abc123",
		bankAccountId: overrides.bankAccountId ?? "ba-abc123",
		periodStart: overrides.periodStart ?? new Date("2026-07-01"),
		periodEnd: overrides.periodEnd ?? new Date("2026-07-31"),
		openingBalance: overrides.openingBalance ?? makeMoney(10000),
		mode: overrides.mode ?? "MANUAL",
	});
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ReconciliationBatch Entity", () => {
	// =========================================================================
	// CREATION
	// =========================================================================
	describe("Creation", () => {
		it("should create a batch with valid data and default status OPEN", () => {
			const batch = createValidBatch();

			expect(batch.companyId).toBe("cmp-abc123");
			expect(batch.bankAccountId).toBe("ba-abc123");
			expect(batch.status).toBe("OPEN");
			expect(batch.matchedCount).toBe(0);
			expect(batch.unmatchedCount).toBe(0);
			expect(batch.mode).toBe("MANUAL");
			expect(batch.openingBalance.getAmount()).toBe(10000);
		});

		it("should auto-generate an id for new batches", () => {
			const batch = createValidBatch();
			expect(batch.id).toBeDefined();
			expect(typeof batch.id).toBe("string");
			expect(batch.id.length).toBeGreaterThan(0);
		});

		it("should create a batch in AUTO mode", () => {
			const batch = createValidBatch({ mode: "AUTO" });
			expect(batch.mode).toBe("AUTO");
		});

		it("should reject invalid period where end is before start", () => {
			expect(() =>
				createValidBatch({
					periodStart: new Date("2026-07-31"),
					periodEnd: new Date("2026-07-01"),
				}),
			).toThrow();
		});

		it("should accept equal periodStart and periodEnd (same-day batch)", () => {
			const date = new Date("2026-07-15");
			const batch = createValidBatch({
				periodStart: date,
				periodEnd: date,
			});
			expect(batch.periodStart).toEqual(date);
			expect(batch.periodEnd).toEqual(date);
		});

		it("should set closedAt to null on creation", () => {
			const batch = createValidBatch();
			expect(batch.closedAt).toBeNull();
		});

		it("should set createdAt to current timestamp", () => {
			const before = new Date();
			const batch = createValidBatch();
			const after = new Date();
			expect(batch.createdAt.getTime()).toBeGreaterThanOrEqual(
				before.getTime() - 1000,
			);
			expect(batch.createdAt.getTime()).toBeLessThanOrEqual(
				after.getTime() + 1000,
			);
		});
	});

	// =========================================================================
	// STATUS TRANSITIONS
	// =========================================================================
	describe("Status transitions", () => {
		it("should support OPEN → IN_PROGRESS transition", () => {
			const batch = createValidBatch();
			const inProgress = batch.startProcessing();
			expect(inProgress.status).toBe("IN_PROGRESS");
		});

		it("should support IN_PROGRESS → PARTIALLY_MATCHED transition", () => {
			const batch = createValidBatch().startProcessing();
			// Add some matches and some unmatched
			const withMatches = batch.addMatch(5).addUnmatched(3);
			expect(withMatches.status).toBe("PARTIALLY_MATCHED");
			expect(withMatches.matchedCount).toBe(5);
			expect(withMatches.unmatchedCount).toBe(3);
		});

		it("should transition to MATCHED when all transactions are matched", () => {
			const batch = createValidBatch().startProcessing();
			const fullyMatched = batch.addMatch(10);
			expect(fullyMatched.status).toBe("MATCHED");
		});

		it("should support MATCHED → CLOSED transition via close()", () => {
			const batch = createValidBatch().startProcessing();
			const matched = batch.addMatch(5); // all matched, status → MATCHED
			// closingBalance matches openingBalance → zero discrepancy → CLOSED
			const closed = matched.close(makeMoney(10000));
			expect(closed.status).toBe("CLOSED");
			expect(closed.closedAt).not.toBeNull();
		});

		it("should support PARTIALLY_MATCHED → CLOSED_WITH_DISCREPANCY via close()", () => {
			const batch = createValidBatch().startProcessing();
			const partial = batch.addMatch(3).addUnmatched(2);
			expect(partial.status).toBe("PARTIALLY_MATCHED");

			const closed = partial.close(makeMoney(11000));
			expect(closed.status).toBe("CLOSED_WITH_DISCREPANCY");
			expect(closed.closedAt).not.toBeNull();
		});
	});

	// =========================================================================
	// IMMUTABILITY AFTER CLOSURE
	// =========================================================================
	describe("Immutability after closure", () => {
		it("should reject addMatch after batch is CLOSED", () => {
			const batch = createValidBatch()
				.startProcessing()
				.addMatch(5)
				.close(makeMoney(10000)); // zero discrepancy → CLOSED

			expect(batch.status).toBe("CLOSED");
			expect(() => batch.addMatch(1)).toThrow();
		});

		it("should reject addUnmatched after batch is CLOSED_WITH_DISCREPANCY", () => {
			const batch = createValidBatch()
				.startProcessing()
				.addMatch(3)
				.addUnmatched(2)
				.close(makeMoney(11000));

			expect(batch.status).toBe("CLOSED_WITH_DISCREPANCY");
			expect(() => batch.addUnmatched(1)).toThrow();
		});

		it("should reject close() on an already closed batch (idempotent close)", () => {
			const batch = createValidBatch()
				.startProcessing()
				.addMatch(5)
				.close(makeMoney(12000));

			expect(() => batch.close(makeMoney(12000))).toThrow();
		});

		it("should reject startProcessing after closure", () => {
			const batch = createValidBatch()
				.startProcessing()
				.addMatch(5)
				.close(makeMoney(12000));

			expect(() => batch.startProcessing()).toThrow();
		});
	});

	// =========================================================================
	// MATCH / UNMATCHED COUNTERS
	// =========================================================================
	describe("Match and unmatched counters", () => {
		it("should increment matchedCount with addMatch", () => {
			const batch = createValidBatch().startProcessing();
			const result = batch.addMatch(3);
			expect(result.matchedCount).toBe(3);
		});

		it("should increment unmatchedCount with addUnmatched", () => {
			const batch = createValidBatch().startProcessing();
			const result = batch.addMatch(2).addUnmatched(4);
			expect(result.matchedCount).toBe(2);
			expect(result.unmatchedCount).toBe(4);
		});

		it("should accumulate across multiple addMatch calls", () => {
			const batch = createValidBatch().startProcessing();
			const result = batch.addMatch(2).addMatch(3).addMatch(1);
			expect(result.matchedCount).toBe(6);
		});

		it("should accumulate across multiple addUnmatched calls", () => {
			const batch = createValidBatch().startProcessing();
			const result = batch.addUnmatched(2).addUnmatched(1);
			expect(result.unmatchedCount).toBe(3);
		});
	});

	// =========================================================================
	// DISCREPANCY CALCULATION
	// =========================================================================
	describe("Discrepancy calculation", () => {
		it("should return zero discrepancy when closing balance matches opening + net movement", () => {
			// opening: 10000, closing: 12500, credits(CREDIT): 3000, debits(DEBIT): 500
			// discrepancy = 12500 - 10000 - (3000 - 500) = 0
			const batch = createValidBatch({
				openingBalance: makeMoney(10000),
			});

			const discrepancy = batch.calculateDiscrepancy(
				makeMoney(12500),
				makeMoney(3000),
				makeMoney(500),
			);

			expect(discrepancy.getAmount()).toBe(0);
		});

		it("should return positive discrepancy when closing balance > expected", () => {
			// opening: 10000, closing: 13000, credits: 2000, debits: 500
			// discrepancy = 13000 - 10000 - (2000 - 500) = 1500
			const batch = createValidBatch({
				openingBalance: makeMoney(10000),
			});

			const discrepancy = batch.calculateDiscrepancy(
				makeMoney(13000),
				makeMoney(2000),
				makeMoney(500),
			);

			expect(discrepancy.getAmount()).toBe(1500);
		});

		it("should return negative discrepancy when closing balance < expected", () => {
			// opening: 10000, closing: 10000, credits: 1000, debits: 0
			// discrepancy = 10000 - 10000 - (1000 - 0) = -1000
			const batch = createValidBatch({
				openingBalance: makeMoney(10000),
			});

			const discrepancy = batch.calculateDiscrepancy(
				makeMoney(10000),
				makeMoney(1000),
				makeMoney(0),
			);

			expect(discrepancy.getAmount()).toBe(-1000);
		});

		it("should reject currencies that differ from opening balance currency", () => {
			const batch = createValidBatch({
				openingBalance: makeMoney(10000, "PEN"),
			});

			expect(() =>
				batch.calculateDiscrepancy(
					makeMoney(12500, "USD"),
					makeMoney(3000, "PEN"),
					makeMoney(500, "PEN"),
				),
			).toThrow();
		});
	});

	// =========================================================================
	// SERIALIZATION
	// =========================================================================
	describe("Serialization", () => {
		it("should serialize to JSON with all fields", () => {
			const batch = createValidBatch({
				openingBalance: makeMoney(10000),
			});

			const json = batch.toJSON();

			expect(json.companyId).toBe("cmp-abc123");
			expect(json.bankAccountId).toBe("ba-abc123");
			expect(json.status).toBe("OPEN");
			expect(json.matchedCount).toBe(0);
			expect(json.unmatchedCount).toBe(0);
			expect(json.mode).toBe("MANUAL");
			expect(json.openingBalance).toBeDefined();
			expect(typeof json.createdAt).toBe("string");
			expect(json.closedAt).toBeNull();
		});

		it("should include closedAt when batch is closed", () => {
			const batch = createValidBatch()
				.startProcessing()
				.addMatch(5)
				.close(makeMoney(10000)); // zero discrepancy → CLOSED

			const json = batch.toJSON();
			expect(json.status).toBe("CLOSED");
			expect(json.closedAt).not.toBeNull();
			expect(typeof json.closedAt).toBe("string");
		});
	});

	// =========================================================================
	// EDGE CASES
	// =========================================================================
	describe("Edge cases", () => {
		it("should create batch with zero opening balance", () => {
			const batch = createValidBatch({
				openingBalance: makeMoney(0),
			});
			expect(batch.openingBalance.getAmount()).toBe(0);
		});

		it("should handle batch with zero matched and zero unmatched", () => {
			const batch = createValidBatch().startProcessing();
			expect(batch.matchedCount).toBe(0);
			expect(batch.unmatchedCount).toBe(0);
			// Status should stay IN_PROGRESS when nothing has been matched
			expect(batch.status).toBe("IN_PROGRESS");
		});

		it("should require startProcessing before addMatch (not allowed in OPEN)", () => {
			const batch = createValidBatch(); // OPEN
			expect(() => batch.addMatch(1)).toThrow();
		});

		it("should require startProcessing before addUnmatched (not allowed in OPEN)", () => {
			const batch = createValidBatch(); // OPEN
			expect(() => batch.addUnmatched(1)).toThrow();
		});
	});
});
