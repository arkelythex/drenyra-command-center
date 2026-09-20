// ============================================================================
// DRENYRA — Canonical Money Formatting
// ============================================================================
//
// The `n()` function is the SINGLE source of truth for formatting monetary
// values in the web app. It is ALWAYS passed as a prop to leaf components —
// never instantiated inline.
//
// Design contract:
//   type WithMoneyFormat = { n: (value: number) => string }
//
// See: .opencode/skills/drenyra-design-system/SKILL.md
// ============================================================================

import type { Currency } from "@drenyra/domain";
import {
	type CountryCode,
	DEFAULT_COUNTRY_CODE,
	getCountryPack,
} from "./latam-country-packs";

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * Money formatter function type.
 *
 * Always passed as a prop — never created inside leaf components.
 *
 * The optional `countryCode` param resolves the display *locale* (grouping,
 * decimal separator, symbol placement) from `latam-country-packs.ts`'s
 * country-pack adapter over `@drenyra/domain`'s `CountryRuntime`. It defaults
 * to Peru, so every existing 1-arg/2-arg call site keeps behaving exactly as
 * before — this only adds the capability for a caller that *does* know the
 * active country (invoice/company context, later tasks) to get correctly
 * localized output.
 *
 * @example
 * ```tsx
 * type Props = { n: MoneyFormatter; amount: number };
 * function Metric({ n, amount }: Props) {
 *   return <span className="font-mono tabular-nums">{n(amount)}</span>;
 * }
 * ```
 */
export type MoneyFormatter = (
	amount: number,
	currency?: Currency,
	countryCode?: CountryCode | string,
) => string;

// ─── Locale resolution & cache ──────────────────────────────────────────────
//
// Locale is resolved per-call from the country pack (`CountryRuntime.getPack`
// via `latam-country-packs.ts`) instead of a fixed module-level constant, so
// a caller that passes a country code gets that country's real locale
// (grouping/decimal separators, symbol placement) rather than always Peru's.
//
// `Currency` (`@drenyra/domain`'s Money VO type) is intentionally narrower
// than the country packs' `defaultCurrency` — it only covers "PEN" | "USD" |
// "EUR" today, while e.g. Mexico/Colombia/Chile's `defaultCurrency` is
// "MXN"/"COP"/"CLP". Widening `Currency` is a `packages/domain` change, out
// of scope here — so the *currency* default still resolves from Peru's pack
// (which is a valid `Currency`), and an explicit `currency` override remains
// the only way to format a different currency; only the *locale* varies with
// `countryCode`.
const DEFAULT_CURRENCY = getCountryPack(DEFAULT_COUNTRY_CODE)
	.defaultCurrency as Currency;

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(
	currency: Currency,
	countryCode: CountryCode | string = DEFAULT_COUNTRY_CODE,
	compact = false,
): Intl.NumberFormat {
	const locale = getCountryPack(countryCode).locale;
	const key = `${locale}~${currency}${compact ? "~compact" : ""}`;
	let formatter = formatterCache.get(key);
	if (formatter) return formatter;

	formatter = new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
		...(compact
			? {
					notation: "compact" as const,
					minimumFractionDigits: 0,
					maximumFractionDigits: 1,
				}
			: {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				}),
	});

	formatterCache.set(key, formatter);
	return formatter;
}

// ─── Core `n()` — The ONE function ──────────────────────────────────────────

/**
 * `n()` — Canonical money formatter for DRENYRA.
 *
 * Formats a numeric amount as a locale-aware currency string.
 * Defaults to PEN (Peruvian Soles) formatted with Peru's locale (`es-PE`)
 * when neither `currency` nor `countryCode` is specified — Peru is still the
 * repo's primary market, so untouched call sites keep working exactly as
 * before. Pass `countryCode` (e.g. `"co"`, `"mx"`, `"cl"`) to format with
 * that country's real locale instead — see `latam-country-packs.ts`.
 *
 * @param amount     - The numeric amount to format.
 * @param currency   - ISO 4217 currency code (default: Peru's, "PEN").
 * @param countryCode - LatAm country pack code (default: `"pe"`); resolves
 *                       the display locale via `getCountryPack()`.
 *
 * @returns Formatted string, e.g. "S/ 1,234.56" or "US$ 1,000.00".
 *
 * @example
 * ```tsx
 * n(1234.56)              // "S/ 1,234.56"
 * n(1000, "USD")          // "USD 1,000.00"
 * n(0)                    // "S/ 0.00"
 * n(-500, "PEN")          // "-S/ 500.00"
 * n(1234.56, "PEN", "co") // "PEN 1.234,56" (Colombia's locale)
 * ```
 */
export function n(
	amount: number,
	currency: Currency = DEFAULT_CURRENCY,
	countryCode: CountryCode | string = DEFAULT_COUNTRY_CODE,
): string {
	return getFormatter(currency, countryCode).format(amount);
}

// ─── Pre-bound helpers ──────────────────────────────────────────────────────

/** Pre-bound `n()` for PEN — use when currency is always soles. */
export const nPEN = (
	amount: number,
	countryCode: CountryCode | string = DEFAULT_COUNTRY_CODE,
): string => n(amount, "PEN", countryCode);

/** Pre-bound `n()` for USD. */
export const nUSD = (
	amount: number,
	countryCode: CountryCode | string = DEFAULT_COUNTRY_CODE,
): string => n(amount, "USD", countryCode);

/** Pre-bound `n()` for EUR. */
export const nEUR = (
	amount: number,
	countryCode: CountryCode | string = DEFAULT_COUNTRY_CODE,
): string => n(amount, "EUR", countryCode);

// ─── Compact notation ───────────────────────────────────────────────────────

/**
 * Compact money notation, e.g. "S/ 1.2K" or "US$ 5.3M".
 * Useful for dashboards and compact KPIs.
 */
export function nCompact(
	amount: number,
	currency: Currency = DEFAULT_CURRENCY,
	countryCode: CountryCode | string = DEFAULT_COUNTRY_CODE,
): string {
	return getFormatter(currency, countryCode, true).format(amount);
}

// ─── Utility: create a pre-bound formatter ──────────────────────────────────

/**
 * Creates a `MoneyFormatter` pre-bound to a specific currency (and,
 * optionally, a specific country's locale).
 *
 * @example
 * ```tsx
 * const formatEUR = createFormatter("EUR");
 * formatEUR(99.90) // "EUR 99,90"
 * ```
 */
export function createFormatter(
	currency: Currency,
	countryCode: CountryCode | string = DEFAULT_COUNTRY_CODE,
): MoneyFormatter {
	return (amount: number) => n(amount, currency, countryCode);
}

// ─── React hook ─────────────────────────────────────────────────────────────

import { useCallback } from "react";

/**
 * React hook returning a stable `n()` function.
 *
 * The returned function is referentially stable — safe to pass as a prop
 * without causing unnecessary re-renders.
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const n = useMoneyFormatter();
 *   return <MetricCard amount={total} n={n} />;
 * }
 * ```
 */
export function useMoneyFormatter(): MoneyFormatter {
	return useCallback(
		(
			amount: number,
			currency: Currency = DEFAULT_CURRENCY,
			countryCode: CountryCode | string = DEFAULT_COUNTRY_CODE,
		) => n(amount, currency, countryCode),
		[],
	);
}
