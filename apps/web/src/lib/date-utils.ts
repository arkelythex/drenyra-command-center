/**
 * Date utility functions for dashboard month selector
 * Following React 2025/2026 best practices with immutable operations
 */

/**
 * Check if a date represents the current month and year
 */
export function isCurrentMonth(date: Date): boolean {
  const now = new Date();
  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

/**
 * Check if a date is in the future (month and year)
 */
export function isFutureMonth(date: Date): boolean {
  const now = new Date();
  const dateMonth = new Date(date.getFullYear(), date.getMonth());
  const nowMonth = new Date(now.getFullYear(), now.getMonth());
  return dateMonth > nowMonth;
}

/**
 * Check if two dates are in the same month and year
 */
export function isSameMonth(date1: Date, date2: Date): boolean {
  return (
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

/**
 * Get the first and last day of a month
 */
export function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Format a date as "Month Year" in the specified locale
 * @example formatMonthYear(new Date(2026, 0), 'es-ES') => "Enero 2026"
 */
export function formatMonthYear(date: Date, locale: string = 'es-ES'): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Format month name only (capitalized)
 * @example getMonthName(new Date(2026, 0), 'es-ES') => "Enero"
 */
export function getMonthName(date: Date, locale: string = 'es-ES'): string {
  const monthName = new Intl.DateTimeFormat(locale, { month: 'long' }).format(date);
  return monthName.charAt(0).toUpperCase() + monthName.slice(1);
}

/**
 * Validate if month and year are within reasonable bounds
 */
export function isValidMonthYear(month: number, year: number): boolean {
  if (month < 1 || month > 12) return false;
  if (year < 2000 || year > 2100) return false;
  return true;
}

/**
 * Create a Date object from month (1-12) and year
 */
export function createDateFromMonthYear(month: number, year: number): Date {
  // month is 1-indexed for URL params, but Date constructor expects 0-indexed
  return new Date(year, month - 1, 1);
}

/**
 * Extract month (1-12) and year from a Date object
 */
export function extractMonthYear(date: Date): { month: number; year: number } {
  return {
    month: date.getMonth() + 1, // Convert to 1-indexed for URL params
    year: date.getFullYear(),
  };
}
