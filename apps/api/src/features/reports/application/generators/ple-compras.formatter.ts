/**
 * PLE Registro de Compras Formatter
 *
 * Generates SUNAT Formato 5.1 fixed-width text for the Purchase Register (LE-COMPRAS).
 * Each line represents a purchase invoice with IGV, detraction, and retention breakdown.
 */

import type { PleComprasRecord } from "../../domain/ple.types";
import { formatRecord } from "./ple-formatter.utils";

/**
 * Format a single Registro de Compras record line.
 */
export function formatComprasLine(record: PleComprasRecord): string {
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
		[record.supplierRuc, 14],
		[record.supplierName, 40],
		[record.taxablePurchases, 12, true],
		[record.igvBase, 12, true],
		[record.igvAmount, 12, true],
		[record.nonTaxablePurchases, 12, true],
		[record.totalPurchases, 12, true],
		[record.iscAmount, 12, true],
		[record.detractionAmount, 12, true],
		[record.retentionAmount, 12, true],
		[record.totalAmount, 12, true],
		[record.currencyCode, 10],
		[record.exchangeRate, 12, true],
		[record.state, 1],
	]);
}

/**
 * Format multiple purchase records into a PLE Compras text block.
 *
 * @param records - Array of compras records.
 * @param period - The fiscal period (YYYY-MM).
 * @param ruc - The company RUC.
 * @returns Complete PLE Compras text content.
 */
export function formatCompras(
	records: PleComprasRecord[],
	period: string,
	ruc: string,
): string {
	const lines: string[] = [];

	// Header
	lines.push(`|REGISTRO DE COMPRAS|${period}|${ruc}|`);

	// Data lines
	for (const record of records) {
		lines.push(formatComprasLine(record));
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
