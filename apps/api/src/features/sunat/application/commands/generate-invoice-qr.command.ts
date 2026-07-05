import { db } from "@drenyra/persistence/client";
import { and, eq } from "@drenyra/persistence/query";
import { invoices } from "@drenyra/persistence/schema";
import { SunatService } from "../../../../services/sunat.service";
import { fail, getErrorMessage, ok } from "../../../shared/api-response";

type QrGenerationResult =
	| { status: number; body: ReturnType<typeof fail> }
	| { body: ReturnType<typeof ok> };

export async function generateInvoiceQr(
	invoiceId: string,
	companyId: string,
): Promise<QrGenerationResult> {
	try {
		const invoice = await db.query.invoices.findFirst({
			where: and(eq(invoices.id, invoiceId), eq(invoices.companyId, companyId)),
			with: {
				customer: true,
				company: true,
			},
		});

		if (!invoice?.company || !invoice.customer) {
			return {
				status: 404,
				body: fail("Factura no encontrada o datos incompletos", "NOT_FOUND"),
			};
		}

		const qrData = {
			companyRuc: invoice.company.ruc,
			invoiceType: "01" as const,
			series: invoice.series,
			correlative: invoice.correlative,
			igvAmount: Number(invoice.igvAmount),
			totalAmount: Number(invoice.totalAmount),
			issueDate: invoice.issueDate,
			customerDocType: invoice.customer.taxId.length === 11 ? "6" : "1",
			customerDocNumber: invoice.customer.taxId,
		};

		const qrCodeDataURL = await SunatService.generateInvoiceQR(qrData);

		return {
			body: ok({
				qrCode: qrCodeDataURL,
				invoiceNumber: invoice.invoiceNumber,
			}),
		};
	} catch (error: unknown) {
		return {
			status: 500,
			body: fail(
				getErrorMessage(error, "Error al generar código QR"),
				"INTERNAL_ERROR",
			),
		};
	}
}
