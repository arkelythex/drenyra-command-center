/**
 * @fileoverview Validation and normalisation helpers for CSV/file import data.
 *
 * These functions handle:
 * - Date parsing (ISO, Peruvian DD/MM/YYYY, European)
 * - Monetary-amount parsing (US and European notation)
 * - Transaction-type normalisation (CREDIT/DEBIT in EN/ES)
 * - Column-index lookup across candidate header names
 *
 * @see {@link import-utils-parse.ts} for the core parsers
 * @see {@link import-types.ts} for type definitions
 * @see {@link import-constants.ts} for bank-format configuration
 */

/* ------------------------------------------------------------------ */
/*  Date parsing                                                       */
/* ------------------------------------------------------------------ */

/**
 * Attempt to parse a date string in ISO format (`YYYY-MM-DD`) or Peruvian
 * format (`DD/MM/YYYY`).
 *
 * Returns `null` (not throws) for unparseable values, making it safe for
 * bulk data processing.
 *
 * @param value - The raw date string
 * @returns A `Date` object, or `null` if the value cannot be parsed
 *
 * @example
 * ```ts
 * parseDateLoose("2024-01-15")   // => Date(2024-01-15)
 * parseDateLoose("15/01/2024")   // => Date(2024-01-15)
 * parseDateLoose("not-a-date")   // => null
 * parseDateLoose("")             // => null
 * ```
 */
export function parseDateLoose(value: string): Date | null {
	const trimmed = value.trim();
	if (!trimmed) return null;

	const iso = new Date(trimmed);
	if (!Number.isNaN(iso.getTime())) return iso;

	const match = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
	if (!match) return null;

	const day = Number(match[1]);
	const month = Number(match[2]);
	const year = Number(match[3]);
	const date = new Date(year, month - 1, day);
	return Number.isNaN(date.getTime()) ? null : date;
}

/* ------------------------------------------------------------------ */
/*  Amount parsing                                                     */
/* ------------------------------------------------------------------ */

/**
 * Attempt to parse a monetary amount string into a `number`.
 *
 * Handles:
 * - Thousands separators (`1,000.50`)
 * - European format (`1.000,50` → comma as decimal)
 * - Whitespace removal
 * - Non-numeric character stripping
 *
 * Returns `null` (not throws) for unparseable values.
 *
 * @param value - The raw amount string (e.g. `"1,234.56"`, `"1.234,56"`, `"100"`)
 * @returns The parsed number, or `null` if the value cannot be parsed
 *
 * @example
 * ```ts
 * parseAmountLoose("1,234.56")  // => 1234.56
 * parseAmountLoose("1.234,56")  // => 1234.56 (European)
 * parseAmountLoose("abc")       // => null
 * ```
 */
export function parseAmountLoose(value: string): number | null {
	const cleaned = value
		.trim()
		.replace(/\s+/g, "")
		.replace(/[^\d,.-]/g, "");
	if (!cleaned) return null;

	const hasComma = cleaned.includes(",");
	const hasDot = cleaned.includes(".");

	let normalized = cleaned;
	if (hasComma && hasDot) {
		const decimalIsComma = cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".");
		normalized = decimalIsComma
			? cleaned.replace(/\./g, "").replace(",", ".")
			: cleaned.replace(/,/g, "");
	} else if (hasComma) {
		normalized = cleaned.replace(",", ".");
	}

	const valueNumber = Number(normalized);
	return Number.isFinite(valueNumber) ? valueNumber : null;
}

/* ------------------------------------------------------------------ */
/*  Transaction-type normalisation                                     */
/* ------------------------------------------------------------------ */

/**
 * Normalise a transaction-type string to `"CREDIT"` or `"DEBIT"`.
 *
 * Accepts English and Spanish labels:
 * - **CREDIT:** `"CREDIT"`, `"ABONO"`, `"HABER"`, `"INGRESO"`
 * - **DEBIT:** `"DEBIT"`, `"CARGO"`, `"DEBE"`, `"EGRESO"`
 *
 * @param value - The raw type string (case-insensitive, trimmed)
 * @returns `"CREDIT"`, `"DEBIT"`, or `null` if unrecognised
 *
 * @example
 * ```ts
 * normalizeTxType("ABONO")   // => "CREDIT"
 * normalizeTxType("CARGO")   // => "DEBIT"
 * normalizeTxType("unknown") // => null
 * ```
 */
export function normalizeTxType(value: string): "CREDIT" | "DEBIT" | null {
	const normalized = value.trim().toUpperCase();
	if (!normalized) return null;
	if (["CREDIT", "ABONO", "HABER", "INGRESO"].includes(normalized))
		return "CREDIT";
	if (["DEBIT", "CARGO", "DEBE", "EGRESO"].includes(normalized)) return "DEBIT";
	return null;
}

/* ------------------------------------------------------------------ */
/*  Column-index lookup                                                */
/* ------------------------------------------------------------------ */

/**
 * Find the index of the first header that matches any of the given column names.
 *
 * Matching is case-insensitive. Returns `-1` when no name matches.
 *
 * @param headers - Array of header strings from the parsed file
 * @param names - Candidate column names to search for (in priority order)
 * @returns The index of the first match, or `-1`
 *
 * @example
 * ```ts
 * const headers = ["fecha", "monto", "descripcion"]
 * findColumnIndex(headers, ["amount", "monto", "importe"]) // => 1
 * ```
 */
export function findColumnIndex(headers: string[], names: string[]): number {
	return (
		names
			.map((name) =>
				headers.findIndex((h) => h.toLowerCase() === name.toLowerCase()),
			)
			.find((idx) => idx >= 0) ?? -1
	);
}
