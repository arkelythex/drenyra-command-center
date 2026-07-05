/**
 * Assertion helpers for test scenarios.
 *
 * Provides custom assertion utilities beyond standard expect()
 * for common ARKELYTHEX domain validations.
 */
import type { Money } from "@drenyra/domain/value-objects/Money";

/**
 * Assert that two Money amounts are equal within a tolerance (in cents).
 *
 * @param actual - Actual Money amount
 * @param expected - Expected Money amount
 * @param toleranceCents - Maximum allowed difference in cents (default: 1)
 *
 * @example
 * ```ts
 * assertMoneyEqual(actual, expected, 1); // allows 1 cent difference
 * ```
 */
export function assertMoneyEqual(
	actual: Money,
	expected: Money,
	toleranceCents = 0,
): void {
	if (actual.getCurrency() !== expected.getCurrency()) {
		throw new Error(
			`Currency mismatch: expected ${expected.getCurrency()}, got ${actual.getCurrency()}`,
		);
	}

	const diff = Math.abs(actual.getCents() - expected.getCents());
	if (diff > toleranceCents) {
		throw new Error(
			`Money mismatch: expected ${expected.getAmount()} (${expected.getCents()} cents), ` +
				`got ${actual.getAmount()} (${actual.getCents()} cents), ` +
				`difference: ${diff} cents (tolerance: ${toleranceCents})`,
		);
	}
}

/**
 * Assert that a Money amount is zero.
 */
export function assertMoneyIsZero(m: Money): void {
	if (!m.isZero()) {
		throw new Error(`Expected zero, got ${m.getAmount()} ${m.getCurrency()}`);
	}
}

/**
 * Assert that a Money amount is positive.
 */
export function assertMoneyIsPositive(m: Money): void {
	if (!m.isPositive()) {
		throw new Error(`Expected positive amount, got ${m.getAmount()}`);
	}
}

/**
 * Assert that a value is within a numeric range.
 */
export function assertInRange(
	value: number,
	min: number,
	max: number,
	label = "value",
): void {
	if (value < min || value > max) {
		throw new Error(`${label} ${value} is not in range [${min}, ${max}]`);
	}
}

/**
 * Assert that an array has the expected length.
 */
export function assertLength<T>(
	arr: readonly T[],
	expected: number,
	label = "array",
): void {
	if (arr.length !== expected) {
		throw new Error(`${label} length: expected ${expected}, got ${arr.length}`);
	}
}

/**
 * Assert that an array is not empty.
 */
export function assertNotEmpty<T>(arr: readonly T[], label = "array"): void {
	if (arr.length === 0) {
		throw new Error(`${label} should not be empty`);
	}
}

/**
 * Assert that all items in an array are unique by a key.
 */
export function assertUniqueBy<T>(
	arr: readonly T[],
	keyFn: (item: T) => string | number,
	label = "array",
): void {
	const seen = new Set<string | number>();
	for (const item of arr) {
		const key = keyFn(item);
		if (seen.has(key)) {
			throw new Error(`${label} has duplicate key: ${key}`);
		}
		seen.add(key);
	}
}

/**
 * Assert that a promise rejects with the expected error message.
 */
export async function assertRejectsWith(
	promise: Promise<unknown>,
	expectedMessage: string,
): Promise<void> {
	try {
		await promise;
		throw new Error("Expected promise to reject, but it resolved");
	} catch (error: unknown) {
		if (error instanceof Error) {
			if (!error.message.includes(expectedMessage)) {
				throw new Error(
					`Expected error message to include "${expectedMessage}", got "${error.message}"`,
				);
			}
		} else {
			throw new Error(
				`Expected error with message "${expectedMessage}", got ${String(error)}`,
			);
		}
	}
}
