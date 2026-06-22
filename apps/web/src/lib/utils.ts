// ============================================================================
// ARKELYTHEX Web App — Shared Utilities
// ============================================================================

export { cn } from "@arkelythex/ui";

// ─── Canonical Money Formatting ─────────────────────────────────────────────
//
// Use `n()` everywhere. It is the SINGLE source of truth.
// Pass as a prop — never create Intl.NumberFormat inside leaf components.
// ─────────────────────────────────────────────────────────────────────────────

export {
	n,
	nPEN,
	nUSD,
	nEUR,
	nCompact,
	createFormatter,
	useMoneyFormatter,
} from "./money";

export type { MoneyFormatter } from "./money";

// ─── Legacy Helper: formatPEN with custom fraction digits ───────────────────

/**
 * Format PEN with optional override for fraction digits.
 *
 * Unlike `n()` which always uses 2 decimals, this allows customisation
 * for edge cases (e.g. UI showing 0 or 3+ decimals).
 *
 * @deprecated Prefer `n()` for standard formatting. Use this only when
 *             you need non-default fraction digits.
 */
export function formatPEN(
	amount: number,
	fractionDigits?: number,
): string {
	return new Intl.NumberFormat("es-PE", {
		style: "currency",
		currency: "PEN",
		minimumFractionDigits: fractionDigits ?? 2,
		maximumFractionDigits: fractionDigits ?? 2,
	}).format(amount);
}

/**
 * Format PEN in compact notation (e.g. "S/ 1.2K").
 *
 * @deprecated Use `nCompact()` from `@/lib/money` instead.
 */
export const formatPENCompact: typeof import("./money").nCompact = (
	amount,
	currency = "PEN",
) => {
	return new Intl.NumberFormat("es-PE", {
		style: "currency",
		currency,
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(amount);
};

/**
 * Percentage formatter.
 */
export const formatPercent = (value: number, decimals = 1) => {
	return new Intl.NumberFormat("es-PE", {
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
	return new Intl.DateTimeFormat("es-PE", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(d);
};

/**
 * General-purpose currency formatter (maps to PEN).
 *
 * @deprecated Use `n()` or `nPEN` instead.
 */
export function formatCurrency(amount: number) {
	return formatPEN(amount);
}
