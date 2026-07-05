import type { ImportTransactionInput } from "../agentic-ledger.service";

/**
 * Supported bank export formats for CSV ingestion.
 *
 * @example
 * ```ts
 * const format: BankCsvFormat = "BCP";
 * ```
 */
export type BankCsvFormat =
	| "BCP"
	| "BBVA"
	| "INTERBANK"
	| "SCOTIABANK"
	| "GENERIC";

/**
 * Result of parsing a bank-export CSV.
 *
 * @example
 * ```ts
 * const res: BankCsvParseResult = { transactions: [], warnings: [] };
 * ```
 */
export type BankCsvParseResult = {
	transactions: ImportTransactionInput[];
	warnings: string[];
};
