/**
 * CAP-SIRE-01 Phase C.5 — Reversibility window tests
 *
 * Strict TDD: RED → GREEN → TRIANGULATE → REFACTOR
 */
import { describe, expect, it, vi } from "vitest";
import { SireRevertService } from "../../services/sire-revert.service";

// Mock the DB and audit log queries
vi.mock("@drenyra/persistence/client", () => ({
	db: {
		select: vi.fn(),
		update: vi.fn(),
		insert: vi.fn(),
		transaction: vi.fn((_cb: unknown) => {
			if (typeof _cb === "function") return _cb({});
		}),
		query: { authAuditLogs: { findFirst: vi.fn() } },
	},
}));

vi.mock("@drenyra/persistence/query", () => ({
	and: (...args: unknown[]) => args,
	eq: (a: unknown, b: unknown) => ({ eq: [a, b] }),
}));

vi.mock("@drenyra/persistence/schema", () => ({
	authAuditLogs: { id: "id", details: "details" },
	invoices: { id: "id", companyId: "companyId", invoiceNumber: "invoiceNumber", totalAmount: "totalAmount" },
	bills: { id: "id", companyId: "companyId", billNumber: "billNumber", totalAmount: "totalAmount" },
}));

describe("SireRevertService (Phase C.5)", () => {
	it("C.5.1: revert within window returns success", async () => {
		// The core logic: window validation
		const futureDate = new Date(Date.now() + 12 * 60 * 60 * 1000); // T+12h
		const result = SireRevertService.validateReversibilityWindow({
			revertAvailableUntil: futureDate.toISOString(),
		});

		expect(result.withinWindow).toBe(true);
	});

	it("C.5.5: revert after window expiry returns expired", () => {
		const pastDate = new Date(Date.now() - 1 * 60 * 60 * 1000); // T-1h
		const result = SireRevertService.validateReversibilityWindow({
			revertAvailableUntil: pastDate.toISOString(),
		});

		expect(result.withinWindow).toBe(false);
	});

	it("C.5.9: window computed correctly from company config", () => {
		// 48h window
		const window48 = SireRevertService.computeRevertDeadline(48);
		const window2 = SireRevertService.computeRevertDeadline(2);
		const window24 = SireRevertService.computeRevertDeadline(); // default 24

		const now = Date.now();
		const delta48 = window48.getTime() - now;
		const delta2 = window2.getTime() - now;
		const delta24 = window24.getTime() - now;

		// Allow ±5s tolerance
		expect(Math.abs(delta48 - 48 * 60 * 60 * 1000)).toBeLessThan(5000);
		expect(Math.abs(delta2 - 2 * 60 * 60 * 1000)).toBeLessThan(5000);
		expect(Math.abs(delta24 - 24 * 60 * 60 * 1000)).toBeLessThan(5000);
	});

	it("exact boundary: at deadline, revert is still allowed", () => {
		const exactlyNow = new Date(); // exactly at deadline
		const result = SireRevertService.validateReversibilityWindow({
			revertAvailableUntil: exactlyNow.toISOString(),
		});

		// Should still be within window (>= not >)
		expect(result.withinWindow).toBe(true);
	});

	it("null window: treat as expired", () => {
		const result = SireRevertService.validateReversibilityWindow({
			revertAvailableUntil: null,
		});

		expect(result.withinWindow).toBe(false);
	});
});
