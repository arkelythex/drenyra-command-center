/**
 * Property-Based Tests for Fiscal Domain Invariants
 *
 * These tests verify that fiscal operations (Money, IGV, RUC, Detracción)
 * satisfy mathematical invariants for ALL possible inputs, not just
 * hand-picked examples.
 *
 * Property-based tests are SLOWER than unit tests. They run in CI,
 * not during local development (bun run test:unit).
 *
 * @module @drenyra/domain/property-tests
 */

import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { AccountingPeriod } from "../accounting/accounting-period";
import { Detraccion } from "../accounting/detraccion";
import { IGVDomainService } from "../services/igv-calculator";
import { Money } from "../value-objects/Money";
import { RUC } from "../value-objects/RUC";

// ─── Arbitraries ───────────────────────────────────────────────────────────

/**
 * Generates a Money value with random cents in [-1_000_000_00, 1_000_000_00]
 * and random currency (PEN or USD).
 */
const arbMoney = (): fc.Arbitrary<Money> =>
	fc
		.tuple(
			fc.integer({ min: -1_000_000_00, max: 1_000_000_00 }),
			fc.constantFrom("PEN" as const, "USD" as const),
		)
		.filter(([cents]) => Number.isInteger(cents))
		.map(([cents, currency]) => Money.fromCents(cents, currency));

/** Generates two non-negative Money values with the SAME currency. */
const arbMoneyPair = (): fc.Arbitrary<[Money, Money]> =>
	fc
		.tuple(
			fc.integer({ min: 0, max: 1_000_000_00 }),
			fc.integer({ min: 0, max: 1_000_000_00 }),
			fc.constantFrom("PEN" as const, "USD" as const),
		)
		.map(
			([c1, c2, currency]) =>
				[Money.fromCents(c1, currency), Money.fromCents(c2, currency)] as [
					Money,
					Money,
				],
		);

/** Generates three non-negative Money values with the SAME currency. */
const arbMoneyTriple = (): fc.Arbitrary<[Money, Money, Money]> =>
	fc
		.tuple(
			fc.integer({ min: 0, max: 1_000_000_00 }),
			fc.integer({ min: 0, max: 1_000_000_00 }),
			fc.integer({ min: 0, max: 1_000_000_00 }),
			fc.constantFrom("PEN" as const, "USD" as const),
		)
		.map(
			([c1, c2, c3, currency]) =>
				[
					Money.fromCents(c1, currency),
					Money.fromCents(c2, currency),
					Money.fromCents(c3, currency),
				] as [Money, Money, Money],
		);

/** Generates a positive Money value (no zero, no negative). */
const arbPositiveMoney = (): fc.Arbitrary<Money> =>
	fc
		.integer({ min: 1, max: 10_000_000_00 })
		.map((cents) => Money.fromCents(cents, "PEN"));

/** Generates a valid 11-digit RUC number. */
const arbRUCString = (): fc.Arbitrary<string> =>
	fc
		.integer({ min: 10_000_000_000, max: 20_999_999_999 })
		.map((n: number) => String(n))
		.filter((s: string) => {
			try {
				RUC.create(s);
				return true;
			} catch {
				return false;
			}
		});

// ─── Money Invariants ──────────────────────────────────────────────────────

describe("Money (property-based)", () => {
	it("addition is commutative: a + b = b + a", () => {
		fc.assert(
			fc.property(arbMoneyPair(), ([a, b]) => {
				const sum1 = a.add(b);
				const sum2 = b.add(a);
				return sum1.equals(sum2);
			}),
		);
	});

	it("addition is associative: (a + b) + c = a + (b + c)", () => {
		fc.assert(
			fc.property(arbMoneyTriple(), ([a, b, c]) => {
				const left = a.add(b).add(c);
				const right = a.add(b.add(c));
				return left.equals(right);
			}),
		);
	});

	it("subtraction is inverse of addition: (a + b) - b = a", () => {
		fc.assert(
			fc.property(arbPositiveMoney(), arbPositiveMoney(), (a, b) => {
				const sum = a.add(b);
				const result = sum.subtract(b);
				return result.equals(a);
			}),
		);
	});

	it("multiplying by 1 returns same value", () => {
		fc.assert(
			fc.property(arbMoney(), (a) => {
				const result = a.multiply(1);
				return result.equals(a);
			}),
		);
	});

	it("multiplying by 0 returns zero", () => {
		fc.assert(
			fc.property(arbMoney(), (a) => {
				const zero = a.multiply(0);
				return (
					zero.equals(Money.fromCents(0, "PEN")) ||
					zero.equals(Money.fromCents(0, "USD"))
				);
			}),
		);
	});

	it("currency is preserved across addition", () => {
		fc.assert(
			fc.property(arbMoneyPair(), ([a, b]) => {
				const sum = a.add(b);
				return sum.getCurrency() === a.getCurrency();
			}),
		);
	});
});

// ─── IGV Invariants ────────────────────────────────────────────────────────

describe("IGV (property-based)", () => {
	const igvService = new IGVDomainService();

	it("total = base + igv for all positive amounts", () => {
		fc.assert(
			fc.property(fc.integer({ min: 1, max: 10_000_000_00 }), (baseCents) => {
				const result = igvService.calculateIGV(baseCents);
				return result.totalCents === result.baseCents + result.igvCents;
			}),
		);
	});

	it("IGV is never negative for positive base", () => {
		fc.assert(
			fc.property(fc.integer({ min: 1, max: 10_000_000_00 }), (baseCents) => {
				const result = igvService.calculateIGV(baseCents);
				return result.igvCents >= 0;
			}),
		);
	});

	it("IGV is zero when base is zero", () => {
		const zero = igvService.calculateIGV(0);
		expect(zero.igvCents).toBe(0);
		expect(zero.totalCents).toBe(0);
	});

	it("IGV is proportional: doubling base doubles IGV (approximately)", () => {
		fc.assert(
			fc.property(fc.integer({ min: 100, max: 1_000_000_00 }), (baseCents) => {
				const single = igvService.calculateIGV(baseCents);
				const doubled = igvService.calculateIGV(baseCents * 2);
				// Proportional: doubled IGV should be ~2x single IGV
				// Allow 1 cent rounding difference (SUNAT rounding)
				const diff = Math.abs(doubled.igvCents - single.igvCents * 2);
				return diff <= 1;
			}),
		);
	});

	it("throws for negative base amounts", () => {
		fc.assert(
			fc.property(fc.integer({ max: -1 }), (baseCents) => {
				expect(() => igvService.calculateIGV(baseCents)).toThrow();
			}),
		);
	});
});

// ─── RUC Invariants ────────────────────────────────────────────────────────

describe("RUC (property-based)", () => {
	it("valid RUC string creates valid object with 11 digits", () => {
		fc.assert(
			fc.property(arbRUCString(), (validStr) => {
				const ruc = RUC.create(validStr);
				return ruc.value.length === 11;
			}),
		);
	});

	it("RUC country code is always PE", () => {
		fc.assert(
			fc.property(arbRUCString(), (validStr) => {
				const ruc = RUC.create(validStr);
				return ruc.countryCode === "PE";
			}),
		);
	});

	it("RUC type is always RUC", () => {
		fc.assert(
			fc.property(arbRUCString(), (validStr) => {
				const ruc = RUC.create(validStr);
				return ruc.type === "RUC";
			}),
		);
	});

	it("invalid RUC throws error", () => {
		fc.assert(
			fc.property(
				fc
					.string({ minLength: 1, maxLength: 20 })
					.filter((s) => s.length !== 11 || !/^\d{11}$/.test(s)),
				(invalidRuc: string) => {
					expect(() => RUC.create(invalidRuc)).toThrow();
				},
			),
		);
	});
});

// ─── Detracción Invariants ─────────────────────────────────────────────────

describe("Detracción (property-based)", () => {
	it("detraction percentage is between 0 and 1", () => {
		const arbDetraccion = arbPositiveMoney().chain((amount) =>
			fc
				.tuple(
					fc.string({ minLength: 1, maxLength: 10 }),
					fc.constantFrom("001", "003", "004", "005", "006"),
					fc.integer({ min: 1, max: 100 }),
				)
				.map(([id, spotCode, pct]) => {
					try {
						return Detraccion.create(id, spotCode, pct, amount, `REF-${id}`);
					} catch {
						return null;
					}
				})
				.filter((d): d is Detraccion => d !== null),
		);
		fc.assert(
			fc.property(arbDetraccion, (d) => {
				const rate = d.percentage;
				return rate >= 0 && rate <= 100;
			}),
		);
	});
});

// ─── Accounting Period Invariants ──────────────────────────────────────────

describe("AccountingPeriod (property-based)", () => {
	it("month is always 1-12", () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 2020, max: 2100 }),
				fc.integer({ min: 1, max: 12 }),
				(year, month) => {
					const period = AccountingPeriod.create(year, month);
					return period.month >= 1 && period.month <= 12;
				},
			),
		);
	});

	it("year is always in valid range", () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 2020, max: 2100 }),
				fc.integer({ min: 1, max: 12 }),
				(year, month) => {
					const period = AccountingPeriod.create(year, month);
					return period.year >= 2020 && period.year <= 2100;
				},
			),
		);
	});

	it("invalid year throws error", () => {
		fc.assert(
			fc.property(
				fc.integer({ max: 2019 }),
				fc.integer({ min: 1, max: 12 }),
				(year, month) => {
					expect(() => AccountingPeriod.create(year, month)).toThrow();
				},
			),
		);
	});

	it("invalid month throws error", () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 2020, max: 2100 }),
				fc.integer({ min: 13, max: 24 }),
				(year, month) => {
					expect(() => AccountingPeriod.create(year, month)).toThrow();
				},
			),
		);
	});
});
