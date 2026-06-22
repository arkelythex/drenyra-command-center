/**
 * AccountingPeriod Value Object — Tests
 *
 * Covers:
 * - Happy path: valid period creation
 * - Edge cases: boundary years, months
 * - Error states: invalid year, month, status
 * - State transitions: closePartial, closeFinal, audit
 */

import { describe, expect, it } from "vitest";
import {
	AccountingPeriod,
	InvalidAccountingPeriodError,
	InvalidAccountingTransitionError,
	type AccountingPeriodStatus,
} from "../accounting-period";

describe("AccountingPeriod", () => {
	// --- Happy Path ---

	it("should create a valid period", () => {
		const period = AccountingPeriod.create(2026, 5);
		expect(period.year).toBe(2026);
		expect(period.month).toBe(5);
		expect(period.status).toBe("abierto");
	});

	it("should create a period with custom status", () => {
		const period = AccountingPeriod.create(2025, 12, "cerrado_final");
		expect(period.status).toBe("cerrado_final");
	});

	it("should generate correct period key", () => {
		const period = AccountingPeriod.create(2026, 5);
		expect(period.periodKey).toBe("2026-05");

		const period2 = AccountingPeriod.create(2024, 1);
		expect(period2.periodKey).toBe("2024-01");
	});

	it("should generate correct date range", () => {
		const period = AccountingPeriod.create(2026, 5);
		const range = period.dateRange;

		expect(range.start.getFullYear()).toBe(2026);
		expect(range.start.getMonth()).toBe(4); // 0-indexed
		expect(range.start.getDate()).toBe(1);

		expect(range.end.getFullYear()).toBe(2026);
		expect(range.end.getMonth()).toBe(4); // May is month 4 in 0-indexed
		expect(range.end.getDate()).toBe(31);
	});

	it("should allow entry posting when open", () => {
		const period = AccountingPeriod.create(2026, 5, "abierto");
		expect(period.canPostEntry()).toBe(true);
	});

	it("should NOT allow entry posting when closed", () => {
		const parcial = AccountingPeriod.create(2026, 5, "cerrado_parcial");
		expect(parcial.canPostEntry()).toBe(false);

		const final = AccountingPeriod.create(2026, 5, "cerrado_final");
		expect(final.canPostEntry()).toBe(false);

		const auditado = AccountingPeriod.create(2026, 5, "auditado");
		expect(auditado.canPostEntry()).toBe(false);
	});

	// --- Edge Cases ---

	it("should handle February in leap year", () => {
		const period = AccountingPeriod.create(2024, 2); // 2024 is leap year
		const range = period.dateRange;
		expect(range.end.getDate()).toBe(29);
	});

	it("should handle February in non-leap year", () => {
		const period = AccountingPeriod.create(2023, 2);
		const range = period.dateRange;
		expect(range.end.getDate()).toBe(28);
	});

	it("should work with minimum year (2020)", () => {
		const period = AccountingPeriod.create(2020, 1);
		expect(period.year).toBe(2020);
	});

	it("should work with maximum year (2100)", () => {
		const period = AccountingPeriod.create(2100, 12);
		expect(period.year).toBe(2100);
	});

	// --- Error States ---

	it("should reject year below 2020", () => {
		expect(() => AccountingPeriod.create(2019, 1)).toThrow(
			InvalidAccountingPeriodError,
		);
	});

	it("should reject year above 2100", () => {
		expect(() => AccountingPeriod.create(2101, 1)).toThrow(
			InvalidAccountingPeriodError,
		);
	});

	it("should reject month 0", () => {
		expect(() => AccountingPeriod.create(2026, 0)).toThrow(
			InvalidAccountingPeriodError,
		);
	});

	it("should reject month 13", () => {
		expect(() => AccountingPeriod.create(2026, 13)).toThrow(
			InvalidAccountingPeriodError,
		);
	});

	it("should reject non-integer year", () => {
		expect(() => AccountingPeriod.create(2026.5, 5)).toThrow(
			InvalidAccountingPeriodError,
		);
	});

	it("should reject non-integer month", () => {
		expect(() => AccountingPeriod.create(2026, 5.5)).toThrow(
			InvalidAccountingPeriodError,
		);
	});

	it("should reject invalid status", () => {
		expect(() =>
			AccountingPeriod.create(2026, 5, "invalid" as AccountingPeriodStatus),
		).toThrow(InvalidAccountingPeriodError);
	});

	// --- State Transitions ---

	it("should transition from abierto to cerrado_parcial", () => {
		const period = AccountingPeriod.create(2026, 5, "abierto");
		const closed = period.closePartial();

		expect(closed.status).toBe("cerrado_parcial");
		expect(period.status).toBe("abierto"); // original unchanged
	});

	it("should transition from abierto to cerrado_final", () => {
		const period = AccountingPeriod.create(2026, 5, "abierto");
		const closed = period.closeFinal();

		expect(closed.status).toBe("cerrado_final");
	});

	it("should transition from cerrado_parcial to cerrado_final", () => {
		const period = AccountingPeriod.create(2026, 5, "abierto");
		const parcial = period.closePartial();
		const final = parcial.closeFinal();

		expect(final.status).toBe("cerrado_final");
	});

	it("should transition from cerrado_final to auditado", () => {
		const period = AccountingPeriod.create(2026, 5, "abierto");
		const final = period.closeFinal();
		const audited = final.audit();

		expect(audited.status).toBe("auditado");
	});

	it("should reject closePartial from cerrado_final", () => {
		const period = AccountingPeriod.create(2026, 5, "cerrado_final");
		expect(() => period.closePartial()).toThrow(
			InvalidAccountingTransitionError,
		);
	});

	it("should reject closePartial from auditado", () => {
		const period = AccountingPeriod.create(2026, 5, "auditado");
		expect(() => period.closePartial()).toThrow(
			InvalidAccountingTransitionError,
		);
	});

	it("should reject audit from non-final state", () => {
		const period = AccountingPeriod.create(2026, 5, "abierto");
		expect(() => period.audit()).toThrow(InvalidAccountingTransitionError);
	});

	it("should be idempotent calling closeFinal on cerrado_final", () => {
		const period = AccountingPeriod.create(2026, 5, "cerrado_final");
		const result = period.closeFinal();
		expect(result.status).toBe("cerrado_final");
	});

	it("should reject closeFinal from auditado", () => {
		const period = AccountingPeriod.create(2026, 5, "auditado");
		expect(() => period.closeFinal()).toThrow(
			InvalidAccountingTransitionError,
		);
	});

	// --- Equality & Serialization ---

	it("should detect equal periods", () => {
		const a = AccountingPeriod.create(2026, 5, "abierto");
		const b = AccountingPeriod.create(2026, 5, "abierto");
		expect(a.equals(b)).toBe(true);
	});

	it("should detect non-equal periods", () => {
		const a = AccountingPeriod.create(2026, 5, "abierto");
		const b = AccountingPeriod.create(2026, 6, "abierto");
		const c = AccountingPeriod.create(2026, 5, "cerrado_final");

		expect(a.equals(b)).toBe(false);
		expect(a.equals(c)).toBe(false);
	});

	it("should return false for null/undefined", () => {
		const period = AccountingPeriod.create(2026, 5);
		expect(period.equals(null)).toBe(false);
		expect(period.equals(undefined)).toBe(false);
	});

	it("should serialize to JSON", () => {
		const period = AccountingPeriod.create(2026, 5, "abierto");
		const json = period.toJSON();

		expect(json.year).toBe(2026);
		expect(json.month).toBe(5);
		expect(json.status).toBe("abierto");
		expect(json.periodKey).toBe("2026-05");
	});

	it("should deserialize from JSON", () => {
		const original = AccountingPeriod.create(2026, 5, "cerrado_final");
		const json = original.toJSON();
		const restored = AccountingPeriod.fromJSON(json);

		expect(original.equals(restored)).toBe(true);
	});

	it("should produce readable toString", () => {
		const period = AccountingPeriod.create(2026, 5);
		expect(period.toString()).toBe(
			"AccountingPeriod(2026-05, abierto)",
		);
	});
});
