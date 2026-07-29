/**
 * PLE Generator Service
 *
 * Generates SUNAT-compliant TXT files for PLE book types:
 * LE-DIARIO, LE-MAYOR, LE-COMPRAS, LE-VENTAS.
 *
 * Format: pipe-delimited lines with header containing RUC, period, and book type.
 */
import { createHash } from "node:crypto";
import type {
	PleBookType,
	PleComprasRow,
	PleFileName,
	PleLedgerRow,
	PleMayorRow,
	PleVentasRow,
} from "./ple.types";

// ─── Configuration ─────────────────────────────────────────────────

export interface PleGeneratorServiceConfig {
	ruc: string;
	companyId: string;
	period: string;
}

// ─── Amount Helpers ────────────────────────────────────────────────

function centsToDecimal(cents: number): string {
	return (cents / 100).toFixed(2);
}

function sanitizeField(value: string): string {
	// Remove pipes and newlines from field values to preserve TXT structure
	return value.replace(/[|\n\r]/g, " ").trim();
}

// ─── Header ────────────────────────────────────────────────────────

function buildHeader(
	config: PleGeneratorServiceConfig,
	bookType: PleBookType,
): string {
	return `${config.ruc}|${config.period}|${bookType}`;
}

// ─── LE-DIARIO Generator ───────────────────────────────────────────

function generateDiarioTxt(
	config: PleGeneratorServiceConfig,
	rows: PleLedgerRow[],
): string {
	const header = buildHeader(config, "LE-DIARIO");
	const lines = rows.map((row) => {
		const date = sanitizeField(row.date);
		const gloss = sanitizeField(row.gloss);
		const accountCode = sanitizeField(row.accountCode);
		const debe = centsToDecimal(row.debitCents);
		const haber = centsToDecimal(row.creditCents);
		return `${date}|${gloss}|${accountCode}|${debe}|${haber}`;
	});

	return [header, ...lines].join("\n");
}

// ─── LE-MAYOR Generator ────────────────────────────────────────────

function generateMayorTxt(
	config: PleGeneratorServiceConfig,
	rows: PleMayorRow[],
): string {
	const header = buildHeader(config, "LE-MAYOR");
	const lines = rows.map((row) => {
		const accountCode = sanitizeField(row.accountCode);
		const description = sanitizeField(row.description);
		const saldoAnterior = centsToDecimal(row.balanceAnteriorCents);
		const debe = centsToDecimal(row.debitCents);
		const haber = centsToDecimal(row.creditCents);
		const saldoActual = centsToDecimal(row.balanceActualCents);
		return `${accountCode}|${description}|${saldoAnterior}|${debe}|${haber}|${saldoActual}`;
	});

	return [header, ...lines].join("\n");
}

// ─── LE-COMPRAS Generator ──────────────────────────────────────────

function generateComprasTxt(
	config: PleGeneratorServiceConfig,
	rows: PleComprasRow[],
): string {
	const header = buildHeader(config, "LE-COMPRAS");
	const lines = rows.map((row) => {
		const ruc = sanitizeField(row.rucProveedor);
		const razonSocial = sanitizeField(row.razonSocial);
		const tipo = sanitizeField(row.tipoComprobante);
		const serie = sanitizeField(row.serie);
		const numero = sanitizeField(row.numero);
		const fecha = sanitizeField(row.fecha);
		const base = centsToDecimal(row.baseCents);
		const igv = centsToDecimal(row.igvCents);
		const total = centsToDecimal(row.totalCents);
		return `${ruc}|${razonSocial}|${tipo}|${serie}|${numero}|${fecha}|${base}|${igv}|${total}`;
	});

	return [header, ...lines].join("\n");
}

// ─── LE-VENTAS Generator ───────────────────────────────────────────

function generateVentasTxt(
	config: PleGeneratorServiceConfig,
	rows: PleVentasRow[],
): string {
	const header = buildHeader(config, "LE-VENTAS");
	const lines = rows.map((row) => {
		const ruc = sanitizeField(row.rucCliente);
		const razonSocial = sanitizeField(row.razonSocial);
		const tipo = sanitizeField(row.tipoComprobante);
		const serie = sanitizeField(row.serie);
		const numero = sanitizeField(row.numero);
		const fecha = sanitizeField(row.fecha);
		const base = centsToDecimal(row.baseCents);
		const igv = centsToDecimal(row.igvCents);
		const total = centsToDecimal(row.totalCents);
		return `${ruc}|${razonSocial}|${tipo}|${serie}|${numero}|${fecha}|${base}|${igv}|${total}`;
	});

	return [header, ...lines].join("\n");
}

// ─── Public API ────────────────────────────────────────────────────

export class PleGeneratorService {
	/**
	 * Generate a complete PLE TXT file for the specified book type.
	 */
	static generateBook(
		config: PleGeneratorServiceConfig,
		bookType: PleBookType,
		rows: PleLedgerRow[] | PleMayorRow[] | PleComprasRow[] | PleVentasRow[],
	): string {
		switch (bookType) {
			case "LE-DIARIO":
				return generateDiarioTxt(config, rows as PleLedgerRow[]);
			case "LE-MAYOR":
				return generateMayorTxt(config, rows as PleMayorRow[]);
			case "LE-COMPRAS":
				return generateComprasTxt(config, rows as PleComprasRow[]);
			case "LE-VENTAS":
				return generateVentasTxt(config, rows as PleVentasRow[]);
			default:
				throw new Error(`Unsupported PLE book type: ${bookType}`);
		}
	}

	/**
	 * Generate SUNAT-compliant filename.
	 * Format: RUC-YYYYMM-BOOKTYPE.txt
	 */
	static generateFileName(
		ruc: string,
		period: string,
		bookType: PleBookType,
	): PleFileName {
		const periodCompact = period.replace(/-/g, "");
		const filename = `${ruc}-${periodCompact}-${bookType}.txt`;

		return {
			filename,
			ruc,
			period,
			bookType,
		};
	}

	/**
	 * Generate CDR (Constancia de Recepción) SHA-256 hash.
	 */
	static generateCdrHash(content: string): string {
		return createHash("sha256").update(content, "utf8").digest("hex");
	}

	/**
	 * Generate LE-DIARIO TXT from ledger rows (direct access for service layer).
	 */
	static generateDiarioTxt = generateDiarioTxt;

	/**
	 * Generate LE-MAYOR TXT from mayor rows (direct access for service layer).
	 */
	static generateMayorTxt = generateMayorTxt;

	/**
	 * Generate LE-COMPRAS TXT from purchase rows.
	 */
	static generateComprasTxt = generateComprasTxt;

	/**
	 * Generate LE-VENTAS TXT from sales rows.
	 */
	static generateVentasTxt = generateVentasTxt;
}
