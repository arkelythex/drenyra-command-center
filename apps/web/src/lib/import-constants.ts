/**
 * @fileoverview Constants and configuration for CSV/file import utilities.
 *
 * Pre-configured bank format metadata (BCP, BBVA, Interbank, Scotiabank) enables
 * auto-configuration of delimiter, date format, and expected columns.
 *
 * @see {@link import-utils-parse.ts} for the core parsers
 * @see {@link import-utils-validation.ts} for validation/normalization helpers
 */

import type { Delimiter } from "./import-types";

/**
 * Pre-configured metadata for known Peruvian bank CSV formats.
 *
 * Used by the import UI to auto-configure delimiter, date format, and
 * expected columns when the user selects a bank.
 *
 * @example
 * ```ts
 * const format = BANK_FORMATS.BCP
 * // { name: "BCP", delimiter: ",", dateFormat: "DD/MM/YYYY", expectedColumns: [...] }
 * ```
 */
export const BANK_FORMATS = {
	BCP: {
		name: "BCP",
		delimiter: "," as Delimiter,
		dateFormat: "DD/MM/YYYY" as const,
		expectedColumns: ["fecha", "descripcion", "monto", "tipo", "referencia"],
	},
	BBVA: {
		name: "BBVA",
		delimiter: ";" as Delimiter,
		dateFormat: "DD/MM/YYYY" as const,
		expectedColumns: ["fecha", "concepto", "importe", "dc", "nro"],
	},
	INTERBANK: {
		name: "Interbank",
		delimiter: "," as Delimiter,
		dateFormat: "YYYY-MM-DD" as const,
		expectedColumns: ["date", "description", "amount", "type", "reference"],
	},
	SCOTIABANK: {
		name: "Scotiabank",
		delimiter: ";" as Delimiter,
		dateFormat: "DD/MM/YYYY" as const,
		expectedColumns: ["fecha", "detalle", "valor", "tipo", "referencia"],
	},
	GENERIC: {
		name: "Genérico",
		delimiter: "auto" as const,
		dateFormat: "auto" as const,
		expectedColumns: [],
	},
} as const;

/** Name of a known bank format (key of `BANK_FORMATS`) */
export type BankFormatName = keyof typeof BANK_FORMATS;
/** Metadata value from the `BANK_FORMATS` map */
export type BankFormatMeta =
	(typeof BANK_FORMATS)[keyof typeof BANK_FORMATS];
