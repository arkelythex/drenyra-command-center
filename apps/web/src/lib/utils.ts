// ============================================================================
// ARKELYTHEX Web App — Shared Utilities
// ============================================================================

export { cn } from "@drenyra/ui";

// ─── Canonical Money Formatting ─────────────────────────────────────────────
//
// Use `n()` everywhere. It is the SINGLE source of truth.
// Pass as a prop — never create Intl.NumberFormat inside leaf components.
// ─────────────────────────────────────────────────────────────────────────────

export type { MoneyFormatter } from "./money";
export {
	createFormatter,
	n,
	nCompact,
	nEUR,
	nPEN,
	nUSD,
	useMoneyFormatter,
} from "./money";

import type { Currency } from "@drenyra/domain";
import { DEFAULT_COUNTRY_CODE, getCountryPack } from "./latam-country-packs";
import { n, nCompact } from "./money";

// Locale for the formatters below that `n()`/`nCompact()` can't cover
// (custom fraction digits, percent, date) — resolved from the active
// country pack instead of a hardcoded `"es-PE"` literal. Defaults to Peru,
// same as `money.ts`'s `DEFAULT_CURRENCY`.
const DEFAULT_LOCALE = getCountryPack(DEFAULT_COUNTRY_CODE).locale;

// ─── Legacy Helper: formatPEN with custom fraction digits ───────────────────
//
// `formatPEN`/`formatPENCompact`/`formatCurrency` below used to re-implement
// `Intl.NumberFormat` with a hardcoded `"es-PE"` locale, completely separate
// from (and inconsistent with) `money.ts`'s country-aware `n()`/`nCompact()`.
// They now delegate to `money.ts` so there is exactly one locale/currency
// resolution path — this changes internals only; names and call signatures
// are unchanged for existing callers.

/**
 * Format PEN with optional override for fraction digits.
 *
 * Unlike `n()` which always uses 2 decimals, this allows customisation
 * for edge cases (e.g. UI showing 0 or 3+ decimals). Delegates to
 * `money.ts`'s country-aware formatter (Peru's locale) instead of
 * constructing its own `Intl.NumberFormat`.
 *
 * @deprecated Prefer `n()` for standard formatting. Use this only when
 *             you need non-default fraction digits.
 */
export function formatPEN(amount: number, fractionDigits?: number): string {
	if (fractionDigits === undefined) {
		return n(amount, "PEN");
	}
	// `n()` always uses 2 fraction digits — build a one-off formatter for the
	// non-default case, still resolving the locale from the active country
	// pack (Peru) instead of hardcoding "es-PE".
	return new Intl.NumberFormat(DEFAULT_LOCALE, {
		style: "currency",
		currency: "PEN",
		minimumFractionDigits: fractionDigits,
		maximumFractionDigits: fractionDigits,
	}).format(amount);
}

/**
 * Format PEN in compact notation (e.g. "S/ 1.2K"). Delegates to
 * `money.ts`'s country-aware `nCompact()`.
 *
 * @deprecated Use `nCompact()` from `@/lib/money` instead.
 */
export const formatPENCompact: typeof import("./money").nCompact = (
	amount,
	currency = "PEN",
	countryCode,
) => {
	return nCompact(amount, currency as Currency, countryCode);
};

/**
 * Percentage formatter.
 */
export const formatPercent = (value: number, decimals = 1) => {
	return new Intl.NumberFormat(DEFAULT_LOCALE, {
		style: "percent",
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	}).format(value / 100);
};

/**
 * Standard date formatter (e.g. "10 may. 2026").
 */
export const formatDate = (date: Date | string | number) => {
	const d =
		typeof date === "string" || typeof date === "number"
			? new Date(date)
			: date;
	return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(d);
};

/**
 * General-purpose currency formatter (maps to PEN). Delegates to `n()`.
 *
 * @deprecated Use `n()` or `nPEN` instead.
 */
export function formatCurrency(amount: number) {
	return n(amount, "PEN");
}
