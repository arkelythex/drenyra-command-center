/**
 * QR Code Generation Module
 * Handles QR code generation for invoices
 */

import QRCode from "qrcode";
import type { QRCodeData } from "./sunat-types";

/**
 * Generate QR code for invoice (SUNAT format)
 * Format: RUC|TIPO_DOC|SERIE|CORRELATIVO|IGV|TOTAL|FECHA|TIPO_DOC_CLIENTE|NUM_DOC_CLIENTE
 */
export async function generateInvoiceQR(data: QRCodeData): Promise<string> {
	const qrData = [
		data.companyRuc,
		data.invoiceType,
		data.series,
		data.correlative.toString(),
		data.igvAmount.toFixed(2),
		data.totalAmount.toFixed(2),
		data.issueDate.toISOString().split("T")[0],
		data.customerDocType,
		data.customerDocNumber,
	].join("|");

	try {
		const qrCodeDataURL = await QRCode.toDataURL(qrData, {
			errorCorrectionLevel: "M",
			type: "image/png",
			width: 200,
			margin: 1,
		});

		return qrCodeDataURL;
	} catch (error) {
		throw new Error(
			`Error generating QR code: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}
