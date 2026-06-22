/*
 * Security Utilities for ARKELYTHEX
 * Input sanitization and validation helpers.
 */

/**
 * Escapes SQL-sensitive characters for safe `LIKE`/text search usage.
 *
 * @param input - Raw user-provided search string
 * @param maxLength - Maximum allowed output length
 * @returns Escaped and trimmed value ready to be bound as query parameter
 * @example
 * ```ts
 * const value = sanitizeSqlInput("ACME_100%", 20);
 * // "ACME\\_100\\%"
 * ```
 */
export function sanitizeSqlInput(input: string, maxLength: number = 100): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const escaped = input
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/'/g, "''")
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\^/g, '\\^');

  return escaped.slice(0, maxLength).trim();
}

/**
 * Validates and normalizes UUID v4 strings.
 *
 * @param uuid - Candidate UUID value
 * @returns Lowercase UUID when valid; otherwise `null`
 * @example
 * ```ts
 * const id = sanitizeUuid("550E8400-E29B-41D4-A716-446655440000");
 * // "550e8400-e29b-41d4-a716-446655440000"
 * ```
 */
export function sanitizeUuid(uuid: string): string | null {
  if (!uuid || typeof uuid !== 'string') {
    return null;
  }

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const trimmed = uuid.trim().toLowerCase();

  if (!uuidPattern.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Sanitizes and bounds monetary values represented as text/number.
 *
 * @param value - Candidate numeric input
 * @param maxDecimals - Decimal precision to preserve
 * @returns Normalized decimal string or `null` when invalid/out-of-range
 * @example
 * ```ts
 * const amount = sanitizeMonetaryValue("1500.5", 2);
 * // "1500.50"
 * ```
 */
export function sanitizeMonetaryValue(value: string | number, maxDecimals: number = 2): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const strValue = String(value).trim();
  const cleaned = strValue.replace(/[^0-9.-]/g, '');
  const numericPattern = /^-?\d+(\.\d+)?$/;

  if (!numericPattern.test(cleaned)) {
    return null;
  }

  const num = parseFloat(cleaned);

  if (num < -999999999999.99 || num > 999999999999.99) {
    return null;
  }

  return num.toFixed(maxDecimals);
}

/**
 * Normalizes invoice/correlative strings for deterministic matching.
 *
 * @param number - Candidate invoice identifier
 * @returns Uppercased identifier stripped to `[A-Z0-9-]` and max 20 chars
 * @example
 * ```ts
 * const invoice = sanitizeInvoiceNumber("f001/000123");
 * // "F001000123"
 * ```
 */
export function sanitizeInvoiceNumber(number: string): string {
  if (!number || typeof number !== 'string') {
    return '';
  }

  return number
    .replace(/[^a-zA-Z0-9-]/g, '')
    .slice(0, 20)
    .toUpperCase();
}

/**
 * Builds a wildcard search pattern using SQL-safe escaping.
 *
 * @param searchTerm - Raw user search term
 * @returns `%...%` pattern with validity flag
 * @example
 * ```ts
 * const pattern = createSafeLikePattern("cliente");
 * // { pattern: "%cliente%", isValid: true }
 * ```
 */
export function createSafeLikePattern(searchTerm: string): { pattern: string; isValid: boolean } {
  const sanitized = sanitizeSqlInput(searchTerm, 50);

  if (!sanitized) {
    return { pattern: '', isValid: false };
  }

  return {
    pattern: `%${sanitized}%`,
    isValid: true,
  };
}

/**
 * Validates date range windows used by reporting endpoints.
 *
 * @param startDate - Start date candidate
 * @param endDate - End date candidate
 * @returns Validation envelope with normalized dates or error reason
 * @example
 * ```ts
 * const range = sanitizeDateRange("2026-01-01", "2026-01-31");
 * // { isValid: true, start: Date, end: Date }
 * ```
 */
export function sanitizeDateRange(
  startDate: string | Date,
  endDate: string | Date,
): {
  isValid: boolean;
  start: Date | null;
  end: Date | null;
  error?: string;
} {
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return {
      isValid: false,
      start: null,
      end: null,
      error: 'Invalid date format',
    };
  }

  const maxFuture = new Date();
  maxFuture.setFullYear(maxFuture.getFullYear() + 1);

  if (start > maxFuture || end > maxFuture) {
    return {
      isValid: false,
      start: null,
      end: null,
      error: 'Date too far in future',
    };
  }

  if (start > end) {
    return {
      isValid: false,
      start: null,
      end: null,
      error: 'Start date must be before end date',
    };
  }

  const oneYear = 365 * 24 * 60 * 60 * 1000;
  if (end.getTime() - start.getTime() > oneYear) {
    return {
      isValid: false,
      start: null,
      end: null,
      error: 'Date range cannot exceed 1 year',
    };
  }

  return { isValid: true, start, end };
}

/**
 * Shared validation limits used across API search/pagination guards.
 *
 * @example
 * ```ts
 * const max = SECURITY_CONSTANTS.MAX_QUERY_LIMIT;
 * ```
 */
export const SECURITY_CONSTANTS = {
  MAX_SEARCH_LENGTH: 100,
  MAX_INVOICE_NUMBER_LENGTH: 20,
  MAX_QUERY_LIMIT: 1000,
  DEFAULT_QUERY_LIMIT: 50,
  MAX_DATE_RANGE_DAYS: 365,
  ALLOWED_SORT_FIELDS: ['createdAt', 'updatedAt', 'totalAmount', 'issueDate'],
  ALLOWED_SORT_ORDERS: ['asc', 'desc'],
} as const;

/**
 * Normalizes pagination inputs to safe integer bounds.
 *
 * @param limit - Requested page size
 * @param offset - Requested row offset
 * @returns Clamped pagination tuple plus validity flag
 * @example
 * ```ts
 * const page = sanitizePagination("5000", "-1");
 * // { limit: 1000, offset: 0, isValid: true }
 * ```
 */
export function sanitizePagination(
  limit: number | string,
  offset: number | string,
): { limit: number; offset: number; isValid: boolean } {
  const parsedLimit = Math.min(
    Math.max(parseInt(String(limit)) || SECURITY_CONSTANTS.DEFAULT_QUERY_LIMIT, 1),
    SECURITY_CONSTANTS.MAX_QUERY_LIMIT,
  );

  const parsedOffset = Math.max(parseInt(String(offset)) || 0, 0);

  return {
    limit: parsedLimit,
    offset: parsedOffset,
    isValid: true,
  };
}
