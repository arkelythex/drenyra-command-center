/**
 * PDF Exporter
 * Generates human-readable PDF audit trail reports
 */

import PDFDocument from "pdfkit";
import type { GetTrailResult } from "../application/queries/get-trail.query";

/**
 * PdfExportOptions interface.
 *
 * @example
 * ```ts
 * const value: PdfExportOptions = {} as PdfExportOptions;
 * console.log(value);
 * ```
 */
export interface PdfExportOptions {
	companyName: string;
	reportDate: Date;
	companyRuc?: string;
}

/**
 * exportToPdf operation.
 *
 * @param trail - Input for trail.
 * @param options - Input for options.
 * @returns Result of exportToPdf.
 * @example
 * ```ts
 * const result = await exportToPdf({} as GetTrailResult, {} as PdfExportOptions);
 * console.log(result);
 * ```
 */
export async function exportToPdf(
	trail: GetTrailResult,
	options: PdfExportOptions,
): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const doc = new PDFDocument({ margin: 40, size: "A4" });
		const chunks: Buffer[] = [];

		doc.on("data", (chunk: Buffer | Uint8Array) =>
			chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
		);
		doc.on("end", () => resolve(Buffer.concat(chunks)));
		doc.on("error", reject);

		renderHeader(doc, options, trail.total);
		renderEntries(doc, trail);

		doc.end();
	});
}

function renderHeader(
	doc: PDFKit.PDFDocument,
	options: PdfExportOptions,
	totalEntries: number,
): void {
	doc.fontSize(18).text("ARKELYTHEX Audit Trail", { align: "left" });
	doc.moveDown(0.5);
	doc.fontSize(10).text(`Empresa: ${options.companyName}`);
	if (options.companyRuc) {
		doc.text(`RUC: ${options.companyRuc}`);
	}
	doc.text(`Generado: ${options.reportDate.toISOString()}`);
	doc.text(`Total entradas: ${totalEntries}`);
	doc.moveDown(1);
	doc.fontSize(11).text("Entradas", { underline: true });
	doc.moveDown(0.5);
}

function renderEntries(doc: PDFKit.PDFDocument, trail: GetTrailResult): void {
	for (const log of trail.logs) {
		doc.fontSize(9).fillColor("#111111");
		doc.text(
			`[${log.createdAt.toISOString()}] ${log.agentName} -> ${log.decisionType}`,
		);
		doc.fillColor("#444444");
		doc.text(`Hash: ${log.hash}`);
		doc.text(`Prev: ${log.prevHash ?? "GENESIS"}`);
		if (log.reasoning) {
			doc.text(`Reasoning: ${log.reasoning}`);
		}
		doc.text(`Inputs: ${safeJson(log.inputs)}`);
		doc.text(`Outputs: ${safeJson(log.outputs)}`);
		doc.moveDown(0.8);

		if (doc.y > 740) {
			doc.addPage();
		}
	}
}

function safeJson(value: unknown): string {
	const json = JSON.stringify(value);
	if (!json) return "null";
	return json.length > 500 ? `${json.slice(0, 500)}...` : json;
}

/**
 * generateHtmlReport operation.
 *
 * @param trail - Input for trail.
 * @param options - Input for options.
 * @returns Result of generateHtmlReport.
 * @example
 * ```ts
 * const result = generateHtmlReport({} as GetTrailResult, {} as PdfExportOptions);
 * console.log(result);
 * ```
 */
export function generateHtmlReport(
	trail: GetTrailResult,
	options: PdfExportOptions,
): string {
	return [
		"<html><body>",
		`<h1>Audit Trail - ${options.companyName}</h1>`,
		`<p>Total entradas: ${trail.total}</p>`,
		"</body></html>",
	].join("");
}
