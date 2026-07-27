/**
 * PLE Registro de Ventas Formatter
 *
 * Generates SUNAT Formato 5.1 fixed-width text for the Sales Register (LE-VENTAS).
 * Each line represents a sales invoice with IGV breakdown.
 */

import type { PleVentasRecord } from "../../domain/ple.types";
import { formatRecord } from "./ple-formatter.utils";

/**
 * Format a single Registro de Ventas record line.
 */
export function formatVentasLine(record: PleVentasRecord): string {
	return formatRecord([
		[record.period, 2],
		[record.fiscalYear, 4],
		[record.ruc, 14],
		[record.operationDate, 10],
		[record.issueDate, 10],
		[record.dueDate, 10],
		[record.documentType, 2],
		[record.documentSeries, 20],
		[record.documentNumber, 20],
		[record.customerRuc, 14],
		[record.customerName, 40],
		[record.taxableSales, 12, true],
		[record.igvBase, 12, true],
		[record.igvAmount, 12, true],
		[record.exports, 12, true],
		[record.nonTaxableSales, 12, true],
		[record.iscAmount, 12, true],
		[record.discounts, 12, true],
		[record.totalAmount, 12, true],
		[record.currencyCode, 10],
		[record.exchangeRate, 12, true],
		[record.state, 1],
	]);
}

/**
 * Format multiple sales records into a PLE Ventas text block.
 *
 * @param records - Array of ventas records.
 * @param period - The fiscal period (YYYY-MM).
 * @param ruc - The company RUC.
 * @returns Complete PLE Ventas text content.
 */
export function formatVentas(
	records: PleVentasRecord[],
	period: string,
	ruc: string,
): string {
	const lines: string[] = [];

	// Header
	lines.push(`|REGISTRO DE VENTAS|${period}|${ruc}|`);

	// Data lines
	for (const record of records) {
		lines.push(formatVentasLine(record));
	}

	// Footer summary
	const totalIgv = records.reduce(
		(sum, r) => sum + parseInt(r.igvAmount || "0", 10),
		0,
	);
	const totalAmount = records.reduce(
		(sum, r) => sum + parseInt(r.totalAmount || "0", 10),
		0,
	);
	lines.push(
		`TOTAL IGV:${String(totalIgv).padStart(14, "0")}|TOTAL:${String(totalAmount).padStart(14, "0")}|REGISTROS:${records.length.toString().padStart(6, "0")}|`,
	);

	return lines.join("\n");
}
