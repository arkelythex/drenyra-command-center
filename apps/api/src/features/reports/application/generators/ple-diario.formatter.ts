/**
 * PLE Libro Diario Formatter
 *
 * Generates SUNAT Formato 5.1 fixed-width text for the Journal Book (LE-DIARIO).
 * Each line is a pipe-delimited record with 21 fields.
 *
 * @see {@link https://docs.sunat.gob.pe/ple/formato5.1}
 */

import type { PleDiarioRecord } from "../../domain/ple.types";
import { formatRecord } from "./ple-formatter.utils";

/**
 * Format a single Libro Diario record line.
 *
 * @param record - The diario record to format.
 * @returns A pipe-delimited fixed-width string per SUNAT 5.1 spec.
 */
export function formatDiarioLine(record: PleDiarioRecord): string {
	return formatRecord([
		[record.period, 2],
		[record.fiscalYear, 4],
		[record.ruc, 14],
		[record.voucherNumber, 20],
		[record.operationCode, 2],
		[record.voucherDate, 10],
		[record.operationDate, 10],
		[record.accountCode, 10],
		[record.accountDescription, 40],
		[record.currencyCode, 2],
		[record.debitCents, 12, true],
		[record.creditCents, 12, true],
		[record.glCurrencyCode, 10],
		[record.glDebitCents, 12, true],
		[record.glCreditCents, 12, true],
		[record.transactionType, 10],
		[record.gloss, 40],
		[record.documentType, 2],
		[record.documentNumber, 20],
		[record.documentDate, 10],
		[record.state, 1],
	]);
}

/**
 * Format multiple journal entries into a PLE Diario text block.
 * Includes a header with generation metadata.
 *
 * @param records - Array of diario records.
 * @param period - The fiscal period (YYYY-MM).
 * @param ruc - The company RUC.
 * @returns Complete PLE Diario text content.
 */
export function formatDiario(
	records: PleDiarioRecord[],
	period: string,
	ruc: string,
): string {
	const lines: string[] = [];

	// Header
	lines.push(`|LIBRO DIARIO|${period}|${ruc}|`);

	// Data lines
	for (const record of records) {
		lines.push(formatDiarioLine(record));
	}

	// Footer summary
	const totalDebits = records.reduce(
		(sum, r) => sum + parseInt(r.debitCents || "0", 10),
		0,
	);
	const totalCredits = records.reduce(
		(sum, r) => sum + parseInt(r.creditCents || "0", 10),
		0,
	);
	lines.push(
		`TOTAL DEBITOS:${String(totalDebits).padStart(14, "0")}|TOTAL CREDITOS:${String(totalCredits).padStart(14, "0")}|REGISTROS:${records.length.toString().padStart(6, "0")}|`,
	);

	return lines.join("\n");
}
