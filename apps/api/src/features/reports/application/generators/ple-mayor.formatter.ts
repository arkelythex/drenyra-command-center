/**
 * PLE Libro Mayor Formatter
 *
 * Generates SUNAT Formato 5.1 fixed-width text for the Ledger Book (LE-MAYOR).
 * Each line aggregates account movements for a month.
 */

import type { PleMayorRecord } from "../../domain/ple.types";
import { formatRecord } from "./ple-formatter.utils";

/**
 * Format a single Libro Mayor record line.
 */
export function formatMayorLine(record: PleMayorRecord): string {
	return formatRecord([
		[record.period, 2],
		[record.fiscalYear, 4],
		[record.ruc, 14],
		[record.accountCode, 10],
		[record.accountDescription, 40],
		[record.openingDebitCents, 12, true],
		[record.openingCreditCents, 12, true],
		[record.monthlyDebitsCents, 12, true],
		[record.monthlyCreditsCents, 12, true],
		[record.closingDebitCents, 12, true],
		[record.closingCreditCents, 12, true],
		[record.state, 1],
	]);
}

/**
 * Format multiple account-month records into a PLE Mayor text block.
 *
 * @param records - Array of mayor records.
 * @param period - The fiscal period (YYYY-MM).
 * @param ruc - The company RUC.
 * @returns Complete PLE Mayor text content.
 */
export function formatMayor(
	records: PleMayorRecord[],
	period: string,
	ruc: string,
): string {
	const lines: string[] = [];

	// Header
	lines.push(`|LIBRO MAYOR|${period}|${ruc}|`);

	// Data lines
	for (const record of records) {
		lines.push(formatMayorLine(record));
	}

	// Footer
	lines.push(`REGISTROS:${records.length.toString().padStart(6, "0")}|`);

	return lines.join("\n");
}
