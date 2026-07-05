import QRCode from "qrcode";
import { captureError } from "@/lib/monitoring";
import type { Invoice } from "@/lib/schemas/invoice.schema";

export class PDFService {
	/**
	 * Generate QR code data URL for SUNAT format
	 */
	static async generateQRCode(invoice: Invoice): Promise<string> {
		// SUNAT QR format: RUC|TipoDoc|Serie|Numero|IGV|Total|Fecha|TipoDocCliente|NumDocCliente
		const qrData = [
			"20123456789", // RUC emisor
			"01", // Tipo documento (01 = Factura)
			invoice.series,
			invoice.number,
			invoice.tax,
			invoice.total,
			new Date(invoice.issueDate).toISOString().split("T")[0],
			"6", // Tipo doc cliente (6 = RUC)
			invoice.customerTaxId,
		].join("|");

		try {
			const dataUrl = await QRCode.toDataURL(qrData, {
				width: 200,
				margin: 1,
				errorCorrectionLevel: "M",
			});
			return dataUrl;
		} catch (error) {
			captureError(
				error instanceof Error ? error : new Error("QR generation failed"),
				{
					invoiceNumber: invoice.number,
					source: "services/PDFService.generateQRCode",
				},
			);
			return "";
		}
	}

	/**
	 * Generate PDF blob from invoice data
	 */

	static async generatePDF(_invoice: Invoice): Promise<Blob> {
		// This will be implemented with server-side rendering
		// For now, return empty blob
		return new Blob([], { type: "application/pdf" });
	}

	/**
	 * Download PDF file
	 */
	static downloadPDF(blob: Blob, filename: string): void {
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}
}
