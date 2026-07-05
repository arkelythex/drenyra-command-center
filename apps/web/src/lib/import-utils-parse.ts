/**
 * @fileoverview CSV parsing utilities for importing bank transactions, customer
 * lists, and other tabular data.
 *
 * **Design philosophy:**
 * - CSV parsing is quoted-field aware (handles `"` and `""` escapes)
 * - Delimiter detection is heuristic: tabs beat commas, more semicolons beat commas
 * - Header-row detection checks known financial-column keywords (date, monto, etc.)
 * - All parsing functions are generic so callers can map raw rows to typed objects
 *   via `mapRow`
 *
 * **Error handling:**
 * - `ParseError` rows are collected rather than aborting the whole parse
 * - `parseFile` returns an error entry for unsupported formats instead of throwing
 * - Row-level errors from `mapRow` are caught individually
 *
 * @see {@link import-types.ts} for type definitions
 * @see {@link import-utils-validation.ts} for validation/normalization helpers
 * @see {@link import-constants.ts} for bank-format configuration
 */

import type {
	CSVParserOptions,
	Delimiter,
	FileParserOptions,
	ParseError,
	ParseResult,
} from "./import-types";

/* ------------------------------------------------------------------ */
/*  Private helpers                                                    */
/* ------------------------------------------------------------------ */

const KNOWN_HEADER_WORDS = [
	"date",
	"fecha",
	"description",
	"descripcion",
	"concepto",
	"detalle",
	"amount",
	"monto",
	"importe",
	"valor",
	"type",
	"tipo",
	"reference",
	"referencia",
	"ref",
	"nro",
	"numero",
	"name",
	"nombre",
	"email",
	"correo",
	"total",
] as const;

/* ------------------------------------------------------------------ */
/*  Delimiter detection                                                */
/* ------------------------------------------------------------------ */

/**
 * Detect the most likely column delimiter from the first line of a text file.
 *
 * Priority: tab > semicolon > comma.
 *
 * @param firstLine - The first line (or any representative line) of the file
 * @returns `"\t"` if a tab is present, then `";"` if more semicolons than commas,
 *   otherwise `","`
 *
 * @example
 * ```ts
 * detectDelimiter('"fecha";"monto"') // => ";"
 * detectDelimiter('fecha,monto')     // => ","
 * detectDelimiter('fecha\tmonto')    // => "\t"
 * ```
 */
export function detectDelimiter(firstLine: string): Delimiter {
	if (firstLine.includes("\t")) return "\t";
	const commas = (firstLine.match(/,/g) ?? []).length;
	const semis = (firstLine.match(/;/g) ?? []).length;
	return semis > commas ? ";" : ",";
}

/* ------------------------------------------------------------------ */
/*  Single-line parser                                                 */
/* ------------------------------------------------------------------ */

/**
 * Parse a single CSV line into an array of field values.
 *
 * Handles quoted fields (`"..."`) and escaped quotes (`""`).
 * Trims whitespace from each field.
 *
 * @param line - A single line of CSV text (without trailing newline)
 * @param delimiter - The column delimiter character
 * @returns Array of field values in order
 *
 * @example
 * ```ts
 * parseCsvLine('"foo, bar",baz,"""quoted"""', ",")
 * // => ["foo, bar", "baz", "\"quoted\""]
 * ```
 */
export function parseCsvLine(line: string, delimiter: Delimiter): string[] {
	const out: string[] = [];
	let current = "";
	let inQuotes = false;

	for (let index = 0; index < line.length; index += 1) {
		const ch = line[index];
		if (ch === '"') {
			const next = line[index + 1];
			if (inQuotes && next === '"') {
				current += '"';
				index += 1;
			} else {
				inQuotes = !inQuotes;
			}
			continue;
		}

		if (!inQuotes && ch === delimiter) {
			out.push(current.trim());
			current = "";
			continue;
		}

		current += ch;
	}

	out.push(current.trim());
	return out;
}

/* ------------------------------------------------------------------ */
/*  Header detection                                                   */
/* ------------------------------------------------------------------ */

/**
 * Determine whether a line of parsed fields looks like a header row.
 *
 * A row is considered a header if **any** field matches a known financial-column
 * keyword (e.g. `"date"`, `"monto"`, `"descripcion"`).
 *
 * @param headers - Parsed fields from the first line
 * @returns `true` if the line is likely a header
 *
 * @example
 * ```ts
 * detectHeaderRow(["fecha", "monto", "descripcion"]) // => true
 * detectHeaderRow(["100.50", "ABONO"])               // => false
 * ```
 */
export function detectHeaderRow(headers: string[]): boolean {
	return headers.some((h) =>
		(KNOWN_HEADER_WORDS as readonly string[]).includes(h.toLowerCase()),
	);
}

/* ------------------------------------------------------------------ */
/*  Full CSV parser                                                    */
/* ------------------------------------------------------------------ */

/**
 * Parse a full CSV string into typed rows.
 *
 * **Features:**
 * - Auto-detects delimiter when not specified
 * - Auto-detects header row when not specified (checks known keywords)
 * - Collects row-level errors without aborting
 * - Supports `mapRow` for custom row mapping or type coercion
 *
 * @typeParam T - The output row type (default: `Record<string, string>`)
 * @param content - Full CSV file content
 * @param options - Parsing options
 * @returns A `ParseResult` with `data`, `errors`, and `metadata`
 *
 * @example
 * ```ts
 * const result = parseCSV<Transaction>(
 *   "date,amount\n2024-01-01,100.50\n2024-01-02,200.00",
 *   {
 *     mapRow: (cols, headers) => ({
 *       date: parseDateLoose(cols[0])!,
 *       amount: parseAmountLoose(cols[1])!,
 *     }),
 *   },
 * )
 * console.log(result.data)    // Transaction[]
 * console.log(result.errors)  // ParseError[]
 * ```
 *
 * @see {@link parseFile} for file-level dispatch
 * @see {@link detectHeaderRow} for header-detection logic
 */
export function parseCSV<T = Record<string, string>>(
	content: string,
	options?: CSVParserOptions<T>,
): ParseResult<T> {
	const start = performance.now();
	const errors: ParseError[] = [];

	const lines = content
		.split(/\r?\n/g)
		.map((l) => l.trim())
		.filter((l) => l.length > 0 || options?.skipEmpty === false);

	if (lines.length === 0) {
		return {
			data: [],
			errors,
			metadata: { rowCount: 0, parseTimeMs: performance.now() - start },
		};
	}

	const delimiter = options?.delimiter ?? detectDelimiter(lines[0]);

	const autoDetectHeader =
		options?.hasHeader ?? detectHeaderRow(parseCsvLine(lines[0], delimiter));
	const headers = autoDetectHeader
		? parseCsvLine(lines[0], delimiter).map((h) => h.toLowerCase())
		: [];
	const startIndex = autoDetectHeader ? 1 : 0;
	const dataLineCount = lines.length - startIndex;

	const data: T[] = [];

	for (let i = startIndex; i < lines.length; i++) {
		const cols = parseCsvLine(lines[i], delimiter);

		if (options?.mapRow) {
			try {
				const row = options.mapRow(cols, headers);
				if (row !== null) {
					data.push(row);
				}
			} catch (e) {
				errors.push({
					row: i + 1,
					message:
						e instanceof Error
							? e.message
							: "Error desconocido al parsear fila",
				});
			}
		} else if (headers.length > 0) {
			const row: Record<string, string> = {};
			for (let j = 0; j < headers.length; j++) {
				row[headers[j]] = cols[j] ?? "";
			}
			data.push(row as T);
		}
	}

	return {
		data,
		errors,
		metadata: {
			rowCount: dataLineCount,
			detectedDelimiter: delimiter,
			parseTimeMs: performance.now() - start,
		},
	};
}

/* ------------------------------------------------------------------ */
/*  File parser                                                        */
/* ------------------------------------------------------------------ */

/**
 * Parse a browser `File` object based on its extension or MIME type.
 *
 * Currently supports CSV and TSV. XLSX, XML, and PDF return an error entry.
 *
 * @typeParam T - The output row type
 * @param file - The browser `File` object from an `<input type="file">`
 * @param options - Parsing options (delimiter, header flag)
 * @returns A `ParseResult` — unsupported formats return an error entry instead
 *   of throwing
 *
 * @example
 * ```ts
 * const input = document.querySelector('input[type="file"]')!
 * const file = input.files![0]
 * const result = await parseFile<Transaction>(file, { hasHeader: true })
 * if (result.errors.length) { ... }
 * ```
 *
 * @see {@link parseCSV} used internally for text-based formats
 */
export async function parseFile<T>(
	file: File,
	options?: FileParserOptions,
): Promise<ParseResult<T>> {
	const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

	if (ext === "csv" || file.type === "text/csv") {
		const content = await file.text();
		return parseCSV<T>(content, {
			delimiter: options?.delimiter,
			hasHeader: options?.hasHeader,
		});
	}

	if (ext === "tsv" || file.type === "text/tab-separated-values") {
		const content = await file.text();
		return parseCSV<T>(content, {
			delimiter: options?.delimiter ?? "\t",
			hasHeader: options?.hasHeader,
		});
	}

	return {
		data: [],
		errors: [
			{
				row: 0,
				message: `Formato de archivo no soportado: .${ext}`,
			},
		],
		metadata: { rowCount: 0, parseTimeMs: 0 },
	};
}
