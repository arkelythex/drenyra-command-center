/**
 * SIRE Register Export Service.
 *
 * Generates SUNAT-compliant electronic register files (Registro de Ventas /
 * Registro de Compras) from the database for a given period.
 *
 * **SUNAT Compliance:**
 * - Mandatory since January 2026 (Resolución de Superintendencia N° 271-2013-SUNAT)
 * - Submission deadline: Day 10 of the following month
 * - Penalty for late submission: 0.3% UIT per day
 * - Formats: TXT (pipe-delimited for SUNAT), EXCEL (internal review only)
 *
 * **Architecture:**
 * This service is part of the `sire` Vertical Slice. It handles REGISTER
 * GENERATION from DB. SUNAT submission is handled by `SireSubmissionService`.
 *
 * @see {@link SireSubmissionService} For SUNAT API submission
 * @see {@link https://www.sunat.gob.pe/legislacion/superin/2013/271-2013.pdf} SUNAT Resolution 271-2013
 */

import type {
	Currency,
	SIREExportOptions,
	SIREPurchasesRecord,
	SIRESalesRecord,
	SIRESummary,
	SIREValidationResult,
} from "@drenyra/domain";
import { Money } from "@drenyra/domain";
import { db } from "@drenyra/persistence/client";
import { and, eq, gte, lte, sql } from "@drenyra/persistence/query";
import { bills, invoices } from "@drenyra/persistence/schema";
import ExcelJS from "exceljs";

/**
 * SireRegisterExportService class.
 *
 * @example
 * ```ts
 * const value = new SireRegisterExportService();
 * console.log(value);
 * ```
 */
export class SireRegisterExportService {
	/**
	 * Generate Sales Register (Registro de Ventas).
	 *
	 * Fetches invoices from DB for the period and converts to SIRE format.
	 * Returns TXT (SUNAT-compatible) or Excel buffer (internal review).
	 *
	 * @param options - Export options (year, month, companyId, format)
	 * @returns TXT string or Excel Buffer
	 */
	static async generateSalesRegister(
		options: SIREExportOptions,
	): Promise<string | Buffer> {
		const { year, month, companyId } = options;

		const startDate = new Date(year, month - 1, 1);
		const endDate = new Date(year, month, 0);

		const invoicesList = await db.query.invoices.findMany({
			where: and(
				eq(invoices.companyId, companyId),
				gte(invoices.issueDate, startDate),
				lte(invoices.issueDate, endDate),
			),
			with: { customer: true },
			orderBy: [invoices.issueDate, invoices.invoiceNumber],
		});

		const records: SIRESalesRecord[] = invoicesList.map((invoice, index) => {
			const currency = invoice.currency as Currency;
			const subtotal = Money.fromAmount(parseFloat(invoice.subtotal), currency);
			const igv = Money.fromAmount(parseFloat(invoice.igvAmount), currency);
			const total = Money.fromAmount(parseFloat(invoice.totalAmount), currency);
			const exchangeRate =
				invoice.currency === "USD" ? parseFloat(invoice.exchangeRate) : 1;

			return {
				periodo: `${year}${month.toString().padStart(2, "0")}00`,
				correlativo: (index + 1).toString(),
				fechaEmision: SireRegisterExportService.formatDate(invoice.issueDate),
				tipoComprobante: SireRegisterExportService.getDocumentType(
					invoice.invoiceNumber,
				),
				serie: SireRegisterExportService.getSerie(invoice.invoiceNumber),
				numero: SireRegisterExportService.getNumber(invoice.invoiceNumber),
				numeroFinal: SireRegisterExportService.getNumber(invoice.invoiceNumber),
				tipoDocumentoCliente: invoice.customer?.taxId ? "6" : "1",
				numeroDocumentoCliente: invoice.customer?.taxId || "",
				razonSocialCliente: invoice.customer?.legalName || "",
				valorExportacion: 0,
				baseImponibleOGravada: subtotal.toNumber(),
				descuentoBaseImponible: 0,
				igv: igv.toNumber(),
				descuentoIGV: 0,
				importeExonerado: 0,
				importeInafecto: 0,
				isc: 0,
				baseImponibleIVAP: 0,
				ivap: 0,
				icbper: 0,
				otrosTributos: 0,
				totalComprobante: total.toNumber(),
				tipoMoneda: invoice.currency,
				tipoCambio: Number.isFinite(exchangeRate) ? exchangeRate : 1,
				fechaEmisionModificado: "",
				tipoComprobanteModificado: "",
				serieModificado: "",
				numeroModificado: "",
				estado: invoice.status === "CANCELLED" ? "2" : "1",
			};
		});

		if (options.format === "EXCEL") {
			return SireRegisterExportService.exportSalesToExcel(records, {
				year,
				month,
			});
		}
		return SireRegisterExportService.exportSalesToTXT(records);
	}

	/**
	 * Generate Purchases Register (Registro de Compras).
	 *
	 * Includes detraction tracking (fechaDetraccion, numeroDetraccion) as
	 * required by SUNAT SPOT regulations for services > S/ 700.
	 *
	 * @param options - Export options (year, month, companyId, format)
	 * @returns TXT string or Excel Buffer
	 */
	static async generatePurchasesRegister(
		options: SIREExportOptions,
	): Promise<string | Buffer> {
		const { year, month, companyId } = options;

		const startDate = new Date(year, month - 1, 1);
		const endDate = new Date(year, month, 0);

		const billsList = await db.query.bills.findMany({
			where: and(
				eq(bills.companyId, companyId),
				gte(bills.issueDate, startDate),
				lte(bills.issueDate, endDate),
			),
			with: { vendor: true },
			orderBy: [bills.issueDate, bills.billNumber],
		});

		const records: SIREPurchasesRecord[] = billsList.map((bill, index) => {
			const currency = bill.currency as Currency;
			const subtotal = Money.fromAmount(
				parseFloat(bill.subtotalAmount),
				currency,
			);
			const igv = Money.fromAmount(parseFloat(bill.igvAmount), currency);
			const total = Money.fromAmount(parseFloat(bill.totalAmount), currency);
			const exchangeRate =
				bill.currency === "USD" ? parseFloat(bill.exchangeRate) : 1;

			return {
				periodo: `${year}${month.toString().padStart(2, "0")}00`,
				correlativo: (index + 1).toString(),
				fechaEmision: SireRegisterExportService.formatDate(bill.issueDate),
				fechaVencimiento: SireRegisterExportService.formatDate(bill.dueDate),
				tipoComprobante: SireRegisterExportService.getDocumentType(
					bill.billNumber,
				),
				serie: SireRegisterExportService.getSerie(bill.billNumber),
				anoDUA: "",
				numeroComprobante: SireRegisterExportService.getNumber(bill.billNumber),
				numeroFinal: SireRegisterExportService.getNumber(bill.billNumber),
				tipoDocumentoProveedor: bill.vendor?.taxId ? "6" : "1",
				numeroDocumentoProveedor: bill.vendor?.taxId || "",
				razonSocialProveedor: bill.vendor?.legalName || "",
				baseImponible: subtotal.toNumber(),
				igv: igv.toNumber(),
				baseImponibleNoGravada: 0,
				igvNoGravado: 0,
				baseImponibleNoGravadaNG: 0,
				igvNoGravadoNG: 0,
				valorAdquisicionesNG: 0,
				isc: 0,
				icbper: 0,
				otrosTributos: 0,
				totalComprobante: total.toNumber(),
				tipoMoneda: bill.currency,
				tipoCambio: Number.isFinite(exchangeRate) ? exchangeRate : 1,
				fechaEmisionModificado: "",
				tipoComprobanteModificado: "",
				serieModificado: "",
				numeroDUAModificado: "",
				numeroModificado: "",
				fechaDetraccion: "",
				numeroDetraccion: "",
				retencion: "",
				estado: bill.status === "CANCELLED" ? "2" : "1",
				clasificacionBienes: "",
			};
		});

		if (options.format === "EXCEL") {
			return SireRegisterExportService.exportPurchasesToExcel(records, {
				year,
				month,
			});
		}
		return SireRegisterExportService.exportPurchasesToTXT(records);
	}

	/**
	 * Validate SIRE file format (structural validation only).
	 *
	 * Checks field count, period format, and numeric amounts.
	 * Does NOT validate business logic (RUC checksum, IGV calculation).
	 *
	 * @param content - Raw TXT file content (pipe-delimited)
	 * @param type - 'sales' (30 fields) or 'purchases' (35 fields)
	 */
	static validateSIREFormat(
		content: string,
		type: "sales" | "purchases",
	): SIREValidationResult {
		const lines = content.split("\n").filter((line) => line.trim());
		const errors: SIREValidationResult["errors"] = [];
		const warnings: SIREValidationResult["warnings"] = [];

		lines.forEach((line, index) => {
			const fields = line.split("|");
			const lineNumber = index + 1;
			const expectedFields = type === "sales" ? 30 : 35;

			if (fields.length !== expectedFields) {
				errors.push({
					line: lineNumber,
					field: "general",
					message: `Expected ${expectedFields} fields, got ${fields.length}`,
				});
			}

			if (!/^\d{8}$/.test(fields[0])) {
				errors.push({
					line: lineNumber,
					field: "periodo",
					message: "Period must be YYYYMM00 format",
				});
			}

			const amountFields =
				type === "sales"
					? [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
					: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

			amountFields.forEach((fieldIndex) => {
				if (fields[fieldIndex] && isNaN(parseFloat(fields[fieldIndex]))) {
					warnings.push({
						line: lineNumber,
						field: `field_${fieldIndex}`,
						message: "Amount should be numeric",
					});
				}
			});
		});

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
			recordCount: lines.length,
		};
	}

	/** Get summary statistics for a SIRE period. */
	static async getSummary(options: SIREExportOptions): Promise<SIRESummary> {
		const { year, month, companyId } = options;
		const startDate = new Date(year, month - 1, 1);
		const endDate = new Date(year, month, 0);

		const result = await db
			.select({
				count: sql`COUNT(*)`,
				total: sql`SUM(CAST(${invoices.totalAmount} AS DECIMAL))`,
				igv: sql`SUM(CAST(${invoices.igvAmount} AS DECIMAL))`,
			})
			.from(invoices)
			.where(
				and(
					eq(invoices.companyId, companyId),
					gte(invoices.issueDate, startDate),
					lte(invoices.issueDate, endDate),
				),
			);

		return {
			period: `${year}-${month.toString().padStart(2, "0")}`,
			recordCount: Number(result[0]?.count || 0),
			totalAmount: Number(result[0]?.total || 0),
			totalIGV: Number(result[0]?.igv || 0),
			currency: "PEN",
			generatedAt: new Date(),
		};
	}

	// ── Private Helpers ────────────────────────────────────────────────────────

	private static exportSalesToTXT(records: SIRESalesRecord[]): string {
		return records
			.map((r) =>
				[
					r.periodo,
					r.correlativo,
					r.fechaEmision,
					r.tipoComprobante,
					r.serie,
					r.numero,
					r.numeroFinal,
					r.tipoDocumentoCliente,
					r.numeroDocumentoCliente,
					r.razonSocialCliente,
					SireRegisterExportService.formatAmount(r.valorExportacion),
					SireRegisterExportService.formatAmount(r.baseImponibleOGravada),
					SireRegisterExportService.formatAmount(r.descuentoBaseImponible),
					SireRegisterExportService.formatAmount(r.igv),
					SireRegisterExportService.formatAmount(r.descuentoIGV),
					SireRegisterExportService.formatAmount(r.importeExonerado),
					SireRegisterExportService.formatAmount(r.importeInafecto),
					SireRegisterExportService.formatAmount(r.isc),
					SireRegisterExportService.formatAmount(r.baseImponibleIVAP),
					SireRegisterExportService.formatAmount(r.ivap),
					SireRegisterExportService.formatAmount(r.icbper),
					SireRegisterExportService.formatAmount(r.otrosTributos),
					SireRegisterExportService.formatAmount(r.totalComprobante),
					r.tipoMoneda,
					SireRegisterExportService.formatAmount(r.tipoCambio, 3),
					r.fechaEmisionModificado,
					r.tipoComprobanteModificado,
					r.serieModificado,
					r.numeroModificado,
					r.estado,
				].join("|"),
			)
			.join("\n");
	}

	private static exportPurchasesToTXT(records: SIREPurchasesRecord[]): string {
		return records
			.map((r) =>
				[
					r.periodo,
					r.correlativo,
					r.fechaEmision,
					r.fechaVencimiento,
					r.tipoComprobante,
					r.serie,
					r.anoDUA,
					r.numeroComprobante,
					r.numeroFinal,
					r.tipoDocumentoProveedor,
					r.numeroDocumentoProveedor,
					r.razonSocialProveedor,
					SireRegisterExportService.formatAmount(r.baseImponible),
					SireRegisterExportService.formatAmount(r.igv),
					SireRegisterExportService.formatAmount(r.baseImponibleNoGravada),
					SireRegisterExportService.formatAmount(r.igvNoGravado),
					SireRegisterExportService.formatAmount(r.baseImponibleNoGravadaNG),
					SireRegisterExportService.formatAmount(r.igvNoGravadoNG),
					SireRegisterExportService.formatAmount(r.valorAdquisicionesNG),
					SireRegisterExportService.formatAmount(r.isc),
					SireRegisterExportService.formatAmount(r.icbper),
					SireRegisterExportService.formatAmount(r.otrosTributos),
					SireRegisterExportService.formatAmount(r.totalComprobante),
					r.tipoMoneda,
					SireRegisterExportService.formatAmount(r.tipoCambio, 3),
					r.fechaEmisionModificado,
					r.tipoComprobanteModificado,
					r.serieModificado,
					r.numeroDUAModificado,
					r.numeroModificado,
					r.fechaDetraccion,
					r.numeroDetraccion,
					r.retencion,
					r.estado,
					r.clasificacionBienes,
				].join("|"),
			)
			.join("\n");
	}

	private static async exportSalesToExcel(
		records: SIRESalesRecord[],
		_period: { year: number; month: number },
	): Promise<Buffer> {
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet("Registro de Ventas");
		worksheet.columns = [
			{ header: "Periodo", key: "periodo", width: 12 },
			{ header: "Correlativo", key: "correlativo", width: 12 },
			{ header: "Fecha Emisión", key: "fechaEmision", width: 15 },
			{ header: "Tipo Doc", key: "tipoComprobante", width: 10 },
			{ header: "Serie", key: "serie", width: 10 },
			{ header: "Número", key: "numero", width: 12 },
			{ header: "Tipo Doc Cliente", key: "tipoDocumentoCliente", width: 15 },
			{ header: "Nro Doc Cliente", key: "numeroDocumentoCliente", width: 15 },
			{ header: "Razón Social", key: "razonSocialCliente", width: 40 },
			{ header: "Base Imponible", key: "baseImponibleOGravada", width: 15 },
			{ header: "IGV", key: "igv", width: 12 },
			{ header: "Total", key: "totalComprobante", width: 15 },
			{ header: "Moneda", key: "tipoMoneda", width: 10 },
			{ header: "T.C.", key: "tipoCambio", width: 10 },
			{ header: "Estado", key: "estado", width: 10 },
		];
		records.forEach((record) => worksheet.addRow(record));
		worksheet.getRow(1).font = { bold: true };
		worksheet.getRow(1).fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FF4472C4" },
		};
		const workbookBuffer = await workbook.xlsx.writeBuffer();
		return Buffer.from(workbookBuffer);
	}

	private static async exportPurchasesToExcel(
		records: SIREPurchasesRecord[],
		_period: { year: number; month: number },
	): Promise<Buffer> {
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet("Registro de Compras");
		worksheet.columns = [
			{ header: "Periodo", key: "periodo", width: 12 },
			{ header: "Correlativo", key: "correlativo", width: 12 },
			{ header: "Fecha Emisión", key: "fechaEmision", width: 15 },
			{ header: "Tipo Doc", key: "tipoComprobante", width: 10 },
			{ header: "Serie", key: "serie", width: 10 },
			{ header: "Número", key: "numeroComprobante", width: 12 },
			{
				header: "Tipo Doc Proveedor",
				key: "tipoDocumentoProveedor",
				width: 18,
			},
			{ header: "RUC Proveedor", key: "numeroDocumentoProveedor", width: 15 },
			{ header: "Razón Social", key: "razonSocialProveedor", width: 40 },
			{ header: "Base Imponible", key: "baseImponible", width: 15 },
			{ header: "IGV", key: "igv", width: 12 },
			{ header: "Total", key: "totalComprobante", width: 15 },
			{ header: "Moneda", key: "tipoMoneda", width: 10 },
			{ header: "Estado", key: "estado", width: 10 },
		];
		records.forEach((record) => worksheet.addRow(record));
		worksheet.getRow(1).font = { bold: true };
		worksheet.getRow(1).fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FF70AD47" },
		};
		const workbookBuffer = await workbook.xlsx.writeBuffer();
		return Buffer.from(workbookBuffer);
	}

	private static formatDate(date: Date): string {
		const d = new Date(date);
		const day = d.getDate().toString().padStart(2, "0");
		const month = (d.getMonth() + 1).toString().padStart(2, "0");
		return `${day}/${month}/${d.getFullYear()}`;
	}

	private static formatAmount(amount: number, decimals = 2): string {
		return amount.toFixed(decimals);
	}

	private static getDocumentType(docNumber: string): string {
		if (docNumber.startsWith("F")) return "01";
		if (docNumber.startsWith("B")) return "03";
		return "01";
	}

	private static getSerie(docNumber: string): string {
		return docNumber.split("-")[0] || "";
	}

	private static getNumber(docNumber: string): string {
		return docNumber.split("-")[1] || "";
	}
}
