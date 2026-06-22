import type { Invoice } from "../../domain/invoice.entity";
import type { InvoiceElectronicSummary } from "./invoice-electronic-summary";

/**
 * Serializes invoice aggregates into API-safe payload values.
 *
 * @param invoice - Domain invoice aggregate
 * @param electronicSummary - Optional electronic invoicing summary data
 * @returns Plain JSON-safe invoice response payload
 * @example
 * ```ts
 * const payload = serializeInvoice(invoice);
 * ```
 */
export function serializeInvoice(
	invoice: Invoice,
	electronicSummary?: InvoiceElectronicSummary,
) {
	return {
		id: invoice.id,
		companyId: invoice.companyId,
		customerId: invoice.customerId,
		invoiceNumber: invoice.invoiceNumber,
		series: invoice.series,
		correlative: invoice.correlative,
		issueDate: invoice.issueDate.toISOString(),
		dueDate: invoice.dueDate.toISOString(),
		currency: invoice.currency,
		exchangeRate: invoice.exchangeRate,
		subtotal: invoice.subtotal.toString(),
		igvAmount: invoice.igvAmount.toString(),
		totalAmount: invoice.totalAmount.toString(),
		balanceDue: invoice.balanceDue.toString(),
		status: invoice.status,
		transactionId: electronicSummary?.transactionId ?? null,
		transactionStatus: electronicSummary?.transactionStatus ?? null,
		sunatCdr: invoice.sunatCdr ?? null,
		sunatTicket: invoice.sunatTicket ?? null,
		sunatStatus: electronicSummary?.sunatStatus ?? invoice.sunatStatus ?? null,
		sunatCode: electronicSummary?.sunatCode ?? null,
		sunatMessage: electronicSummary?.sunatMessage ?? null,
		notes: invoice.notes,
		items: invoice.items.map((item) => ({
			id: item.id,
			productId: item.productId,
			description: item.description,
			quantity: item.quantity,
			unitPrice: item.unitPrice.toString(),
			taxType: item.taxType,
			igvRate: item.igvRate,
			subtotal: item.subtotal.toString(),
			igvAmount: item.igvAmount.toString(),
			totalAmount: item.totalAmount.toString(),
		})),
		createdAt: invoice.createdAt.toISOString(),
		updatedAt: invoice.updatedAt.toISOString(),
	};
}
