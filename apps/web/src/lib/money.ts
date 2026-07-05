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

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * Money formatter function type.
 *
 * Always passed as a prop — never created inside leaf components.
 *
 * @example
 * ```tsx
 * type Props = { n: MoneyFormatter; amount: number };
 * function Metric({ n, amount }: Props) {
 *   return <span className="font-mono tabular-nums">{n(amount)}</span>;
 * }
 * ```
 */
export type MoneyFormatter = (amount: number, currency?: Currency) => string;

// ─── Locale & Cache ─────────────────────────────────────────────────────────

const LOCALE = "es-PE";

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: Currency, compact = false): Intl.NumberFormat {
	const key = compact ? `${currency}~compact` : currency;
	let formatter = formatterCache.get(key);
	if (formatter) return formatter;

	formatter = new Intl.NumberFormat(LOCALE, {
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
 * Defaults to PEN (Peruvian Soles) if no currency is specified.
 *
 * @param amount   - The numeric amount to format.
 * @param currency - ISO 4217 currency code (default: "PEN").
 *
 * @returns Formatted string, e.g. "S/ 1,234.56" or "US$ 1,000.00".
 *
 * @example
 * ```tsx
 * n(1234.56)        // "S/ 1,234.56"
 * n(1000, "USD")    // "US$ 1,000.00"
 * n(0)              // "S/ 0.00"
 * n(-500, "PEN")    // "-S/ 500.00"
 * ```
 */
export function n(amount: number, currency: Currency = "PEN"): string {
	return getFormatter(currency).format(amount);
}

// ─── Pre-bound helpers ──────────────────────────────────────────────────────

/** Pre-bound `n()` for PEN — use when currency is always soles. */
export const nPEN = (amount: number): string => n(amount, "PEN");

/** Pre-bound `n()` for USD. */
export const nUSD = (amount: number): string => n(amount, "USD");

/** Pre-bound `n()` for EUR. */
export const nEUR = (amount: number): string => n(amount, "EUR");

// ─── Compact notation ───────────────────────────────────────────────────────

/**
 * Compact money notation, e.g. "S/ 1.2K" or "US$ 5.3M".
 * Useful for dashboards and compact KPIs.
 */
export function nCompact(amount: number, currency: Currency = "PEN"): string {
	return getFormatter(currency, true).format(amount);
}

// ─── Utility: create a pre-bound formatter ──────────────────────────────────

/**
 * Creates a `MoneyFormatter` pre-bound to a specific currency.
 *
 * @example
 * ```tsx
 * const formatEUR = createFormatter("EUR");
 * formatEUR(99.90) // "EUR 99,90"
 * ```
 */
export function createFormatter(currency: Currency): MoneyFormatter {
	return (amount: number) => n(amount, currency);
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
		(amount: number, currency: Currency = "PEN") => n(amount, currency),
		[],
	);
}

// ─── Legacy aliases ─────────────────────────────────────────────────────────

/** @deprecated Use `n()` or `nPEN` instead. */
export const formatPEN = nPEN;
