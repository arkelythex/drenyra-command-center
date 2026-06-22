import { db } from "@arkelythex/persistence/client";
import { and, eq } from "@arkelythex/persistence/query";
import { invoices } from "@arkelythex/persistence/schema";
import { SunatService } from "../../../../services/sunat.service";
import { fail, getErrorMessage, ok } from "../../../shared/api-response";

type XmlGenerationResult =
	| { status: number; body: ReturnType<typeof fail> }
	| { body: ReturnType<typeof ok> };

export async function generateInvoiceXml(
	invoiceId: string,
	companyId: string,
): Promise<XmlGenerationResult> {
	try {
		const invoice = await db.query.invoices.findFirst({
			where: and(eq(invoices.id, invoiceId), eq(invoices.companyId, companyId)),
			with: {
				customer: true,
				items: true,
				company: true,
			},
		});

		if (!invoice) {
			return {
				status: 404,
				body: fail("Factura no encontrada", "NOT_FOUND"),
			};
		}

		if (!invoice.company || !invoice.customer) {
			return {
				status: 400,
				body: fail("Datos de empresa o cliente incompletos", "INVALID_STATE"),
			};
		}

		const xmlData = {
			invoiceNumber: invoice.invoiceNumber,
			series: invoice.series,
			correlative: invoice.correlative,
			issueDate: invoice.issueDate,
			dueDate: invoice.dueDate,
			currency: invoice.currency,
			company: {
				ruc: invoice.company.ruc,
				businessName: invoice.company.businessName,
				address: invoice.company.address || "Sin dirección",
			},
			customer: {
				taxId: invoice.customer.taxId,
				legalName: invoice.customer.legalName,
				address: undefined,
			},
			items: invoice.items.map((item) => ({
				description: item.description,
				quantity: Number(item.quantity),
				unitPrice: Number(item.unitPrice),
				taxType: item.taxType,
				igvRate: Number(item.igvRate),
				subtotal: Number(item.subtotal),
				igvAmount: Number(item.igvAmount),
				totalAmount: Number(item.totalAmount),
			})),
			subtotal: Number(invoice.subtotal),
			igvAmount: Number(invoice.igvAmount),
			totalAmount: Number(invoice.totalAmount),
		};

		const xml = SunatService.generateInvoiceXML(xmlData);

		return {
			body: ok({
				xml,
				invoiceNumber: invoice.invoiceNumber,
			}),
		};
	} catch (error: unknown) {
		return {
			status: 500,
			body: fail(
				getErrorMessage(error, "Error al generar XML"),
				"INTERNAL_ERROR",
			),
		};
	}
}
