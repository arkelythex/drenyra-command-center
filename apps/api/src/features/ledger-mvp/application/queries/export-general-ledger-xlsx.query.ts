import { eq } from "@arkelythex/persistence/query";
import { companies } from "@arkelythex/persistence/schema";
import ExcelJS from "exceljs";
import type { GeneralLedgerEntry } from "../../../../features/ledger/queries/get-general-ledger.query";
import { getGeneralLedger } from "../../../../features/ledger/queries/get-general-ledger.query";
import { db } from "../../../../lib/db";
import { formatDatePE, parseIsoDateOrNull } from "../helpers/export-helpers";

async function generateXLSX(
	entries: GeneralLedgerEntry[],
	company: { businessName: string; ruc: string } | null,
	startDate: Date | null,
	endDate: Date | null,
): Promise<Buffer> {
	const workbook = new ExcelJS.Workbook();
	workbook.creator = "ARKELYTHEX";
	workbook.created = new Date();

	const sheet = workbook.addWorksheet("Libro Mayor");

	sheet.mergeCells("A1:F1");
	const titleCell = sheet.getCell("A1");
	titleCell.value = "Libro Mayor General";
	titleCell.font = { bold: true, size: 14 };
	titleCell.alignment = { horizontal: "center" };

	if (company) {
		sheet.mergeCells("A2:F2");
		sheet.getCell("A2").value =
			`Empresa: ${company.businessName} - RUC: ${company.ruc}`;
		sheet.getCell("A2").font = { size: 10 };
		sheet.getCell("A2").alignment = { horizontal: "center" };
	}

	const startLabel = startDate ? formatDatePE(startDate) : "N/A";
	const endLabel = endDate ? formatDatePE(endDate) : "N/A";
	sheet.mergeCells("A3:F3");
	sheet.getCell("A3").value = `Período: ${startLabel} - ${endLabel}`;
	sheet.getCell("A3").font = { size: 10 };
	sheet.getCell("A3").alignment = { horizontal: "center" };

	const headerRow = sheet.addRow([
		"Fecha",
		"Comprobante",
		"Glosa",
		"Cuenta",
		"Debe",
		"Haber",
	]);
	headerRow.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
	headerRow.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FF2D3748" },
	};
	headerRow.alignment = { horizontal: "center", vertical: "middle" };
	headerRow.height = 22;

	let totalDebe = 0;
	let totalHaber = 0;

	for (const entry of entries) {
		const date = formatDatePE(new Date(entry.date));
		sheet.addRow([
			date,
			entry.voucher,
			entry.glosa,
			entry.cuenta,
			entry.debe,
			entry.haber,
		]);
		totalDebe += entry.debe;
		totalHaber += entry.haber;
	}

	const totalsRow = sheet.addRow([
		"",
		"",
		"",
		"TOTALES",
		totalDebe,
		totalHaber,
	]);
	totalsRow.font = { bold: true, size: 10 };
	totalsRow.eachCell((cell) => {
		cell.border = {
			top: { style: "thin" },
			bottom: { style: "double" },
		};
	});

	sheet.getColumn(1).width = 14;
	sheet.getColumn(2).width = 18;
	sheet.getColumn(3).width = 35;
	sheet.getColumn(4).width = 18;
	sheet.getColumn(5).width = 14;
	sheet.getColumn(6).width = 14;

	sheet.getColumn(5).numFmt = "#,##0.00";
	sheet.getColumn(5).alignment = { horizontal: "right" };
	sheet.getColumn(6).numFmt = "#,##0.00";
	sheet.getColumn(6).alignment = { horizontal: "right" };

	const xlsxBuffer = await workbook.xlsx.writeBuffer();
	return Buffer.from(xlsxBuffer);
}

export async function exportGeneralLedgerXlsx(input: {
	companyId: string;
	startDate?: string;
	endDate?: string;
}): Promise<
	| { ok: true; buffer: Buffer; contentType: string; disposition: string }
	| { ok: false; status: number; message: string; code: string }
> {
	const startDate = parseIsoDateOrNull(input.startDate);
	const endDate = parseIsoDateOrNull(input.endDate);

	if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
		return {
			ok: false,
			status: 400,
			message: "startDate must be <= endDate",
			code: "INVALID_DATE_RANGE",
		};
	}

	const entries = await getGeneralLedger(
		input.companyId,
		startDate ?? new Date(0),
		endDate ?? new Date(),
	);

	const [company] = await db
		.select({ businessName: companies.businessName, ruc: companies.ruc })
		.from(companies)
		.where(eq(companies.id, input.companyId))
		.limit(1);

	const xlsxBuffer = await generateXLSX(
		entries,
		company ?? null,
		startDate,
		endDate,
	);

	return {
		ok: true,
		buffer: xlsxBuffer,
		contentType:
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		disposition: 'attachment; filename="libro-mayor.xlsx"',
	};
}
