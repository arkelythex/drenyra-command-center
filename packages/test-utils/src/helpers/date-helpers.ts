/**
 * Date helpers for test scenarios.
 *
 * Provides utilities for creating predictable dates in tests,
 * avoiding flaky date-dependent assertions.
 */

/**
 * Create a date for N days ago from now.
 *
 * @param days - Number of days ago (positive integer)
 * @returns Date object
 *
 * @example
 * ```ts
 * const yesterday = daysAgo(1);
 * const lastMonth = daysAgo(30);
 * ```
 */
export function daysAgo(days: number): Date {
	const date = new Date();
	date.setDate(date.getDate() - days);
	return date;
}

/**
 * Create a date for N days from now.
 *
 * @param days - Number of days in the future (positive integer)
 * @returns Date object
 */
export function daysFromNow(days: number): Date {
	const date = new Date();
	date.setDate(date.getDate() + days);
	return date;
}

/**
 * Create a date for N hours ago.
 */
export function hoursAgo(hours: number): Date {
	const date = new Date();
	date.setHours(date.getHours() - hours);
	return date;
}

/**
 * Create a date for N hours from now.
 */
export function hoursFromNow(hours: number): Date {
	const date = new Date();
	date.setHours(date.getHours() + hours);
	return date;
}

/**
 * Create a date at the start of the given day (00:00:00.000).
 */
export function startOfDay(date: Date): Date {
	const result = new Date(date);
	result.setHours(0, 0, 0, 0);
	return result;
}

/**
 * Create a date at the end of the given day (23:59:59.999).
 */
export function endOfDay(date: Date): Date {
	const result = new Date(date);
	result.setHours(23, 59, 59, 999);
	return result;
}

/**
 * Create a date for the first day of the month.
 */
export function startOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Create a date for the last day of the month.
 */
export function endOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Check if two dates are the same day (ignoring time).
 */
export function isSameDay(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

/**
 * Create a fixed date for deterministic testing.
 *
 * @param year - Year
 * @param month - Month (1-12)
 * @param day - Day of month
 * @returns Date object at midnight UTC
 */
export function fixedDate(year: number, month: number, day: number): Date {
	return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Create a fixed datetime for deterministic testing.
 */
export function fixedDateTime(
	year: number,
	month: number,
	day: number,
	hours = 0,
	minutes = 0,
	seconds = 0,
): Date {
	return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
}
