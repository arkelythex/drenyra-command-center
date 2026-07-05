import { eq } from "@drenyra/persistence/query";
import { companies } from "@drenyra/persistence/schema";
import PDFDocument from "pdfkit";
import type { GeneralLedgerEntry } from "../../../../features/ledger/queries/get-general-ledger.query";
import { getGeneralLedger } from "../../../../features/ledger/queries/get-general-ledger.query";
import { db } from "../../../../lib/db";
import { formatDatePE, parseIsoDateOrNull } from "../helpers/export-helpers";

function generatePDF(
	entries: GeneralLedgerEntry[],
	company: { businessName: string; ruc: string } | null,
	startDate: Date | null,
	endDate: Date | null,
): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const doc = new PDFDocument({ margin: 40, size: "A4" });
		const chunks: Buffer[] = [];

		doc.on("data", (chunk: Buffer) => chunks.push(chunk));
		doc.on("end", () => resolve(Buffer.concat(chunks)));
		doc.on("error", reject);

		doc
			.fontSize(14)
			.font("Helvetica-Bold")
			.text("Libro Mayor General", { align: "center" });
		doc.moveDown(0.5);

		doc.fontSize(10).font("Helvetica");
		if (company) {
			doc.text(`Empresa: ${company.businessName}`);
			doc.text(`RUC: ${company.ruc}`);
		}
		const startLabel = startDate ? formatDatePE(startDate) : "N/A";
		const endLabel = endDate ? formatDatePE(endDate) : "N/A";
		doc.text(`Período: ${startLabel} - ${endLabel}`);
		doc.moveDown();

		const columns = [
			{ header: "Fecha", width: 75 },
			{ header: "Comprobante", width: 90 },
			{ header: "Glosa", width: 150 },
			{ header: "Cuenta", width: 90 },
			{ header: "Debe", width: 65 },
			{ header: "Haber", width: 65 },
		] as const;

		const totalWidth = columns.reduce((s, c) => s + c.width, 0);
		const leftMargin = 40;

		let y = doc.y;

		function drawHeader() {
			doc.font("Helvetica-Bold").fontSize(8);
			let x = leftMargin;
			for (const col of columns) {
				doc.text(col.header, x, y, { width: col.width, align: "left" });
				x += col.width;
			}
			y += 14;
			doc
				.moveTo(leftMargin, y)
				.lineTo(leftMargin + totalWidth, y)
				.stroke();
			y += 4;
		}

		function checkPageBreak(needed: number) {
			if (y + needed > 760) {
				doc.addPage();
				y = 40;
				drawHeader();
			}
		}

		drawHeader();

		doc.font("Helvetica").fontSize(7.5);

		let totalDebe = 0;
		let totalHaber = 0;

		for (const entry of entries) {
			const rowHeight = 13;
			checkPageBreak(rowHeight);

			let x = leftMargin;
			const date = formatDatePE(new Date(entry.date));
			doc.text(date, x, y, { width: 75, align: "left" });
			x += 75;
			doc.text(entry.voucher, x, y, { width: 90, align: "left" });
			x += 90;
			doc.text(entry.glosa, x, y, { width: 150, align: "left" });
			x += 150;
			doc.text(entry.cuenta, x, y, { width: 90, align: "left" });
			x += 90;
			doc.text(entry.debe.toFixed(2), x, y, { width: 65, align: "right" });
			x += 65;
			doc.text(entry.haber.toFixed(2), x, y, { width: 65, align: "right" });

			totalDebe += entry.debe;
			totalHaber += entry.haber;
			y += rowHeight;
		}

		y += 8;
		doc
			.moveTo(leftMargin, y)
			.lineTo(leftMargin + totalWidth, y)
			.stroke();
		y += 6;

		doc.font("Helvetica-Bold").fontSize(8);
		let x = leftMargin + 75 + 90 + 150 + 90;
		doc.text("TOTALES:", x, y, { width: 65, align: "right" });
		x += 65;
		doc.text(totalDebe.toFixed(2), x, y, { width: 65, align: "right" });
		x += 65;
		doc.text(totalHaber.toFixed(2), x, y, { width: 65, align: "right" });

		doc.end();
	});
}

export async function exportGeneralLedgerPdf(input: {
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

	const pdfBuffer = await generatePDF(
		entries,
		company ?? null,
		startDate,
		endDate,
	);

	return {
		ok: true,
		buffer: pdfBuffer,
		contentType: "application/pdf",
		disposition: 'attachment; filename="libro-mayor.pdf"',
	};
}
