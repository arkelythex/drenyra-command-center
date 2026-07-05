/**
 * @fileoverview Type definitions for CSV/file import utilities.
 *
 * @see {@link import-utils-parse.ts} for the core parsers
 * @see {@link import-utils-validation.ts} for validation/normalization helpers
 * @see {@link import-constants.ts} for bank-format configuration
 */

import type {
	BankCsvFormat,
	ImportTransactionRow,
} from "@/features/banking/api/banking.api.types";

export type { BankCsvFormat, ImportTransactionRow };

/**
 * Supported import file formats.
 */
export type ImportFormat = "csv" | "tsv" | "xlsx" | "xml" | "pdf";

/**
 * Supported column delimiters for CSV-like files.
 */
export type Delimiter = "," | ";" | "\t";

/**
 * Describes a single parse error — a row-level failure that did not halt the
 * entire parse.
 */
export interface ParseError {
	/** 1-based row number in the source file */
	row: number;
	/** Column name that triggered the error (when applicable) */
	column?: string;
	/** Human-readable error description */
	message: string;
	/** The raw value that caused the error */
	value?: string;
}

/**
 * Result of a parse operation — both successfully parsed rows and any errors
 * encountered.
 *
 * @typeParam T - The typed row object produced by parsing
 */
export interface ParseResult<T> {
	/** Successfully parsed rows */
	data: T[];
	/** Row-level errors that did not abort the parse */
	errors: ParseError[];
	/** Metadata about the parse operation */
	metadata: {
		/** Number of data rows (excluding header) */
		rowCount: number;
		/** The delimiter that was used (auto-detected or explicitly set) */
		detectedDelimiter?: Delimiter;
		/** Wall-clock time for the full parse in milliseconds */
		parseTimeMs: number;
	};
}

/**
 * Options for {@link import-utils-parse.ts parseCSV}.
 *
 * @typeParam T - The output row type when using `mapRow`
 */
export interface CSVParserOptions<T> {
	/** Column delimiter (auto-detected from first line when omitted) */
	delimiter?: Delimiter;
	/** Whether the first line is a header row (auto-detected when omitted) */
	hasHeader?: boolean;
	/**
	 * Transformation function called for each parsed row.
	 * Return `null` to skip the row.
	 * When omitted, rows are returned as `Record<string, string>` keyed by header.
	 */
	mapRow?: (cols: string[], headers: string[]) => T | null;
	/** Skip empty lines (default: `true`) */
	skipEmpty?: boolean;
}

/**
 * Options for {@link import-utils-parse.ts parseFile}.
 */
export interface FileParserOptions {
	/** Column delimiter (auto-detected when omitted) */
	delimiter?: Delimiter;
	/** Whether the file has a header row (auto-detected when omitted) */
	hasHeader?: boolean;
}
