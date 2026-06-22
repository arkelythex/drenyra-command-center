import { ElectronicInvoicingService } from "../../../../../services/electronic-invoicing.service";
import type { CompanyContext } from "../../../../../shared/plugins";
import { fail, ok } from "../../../../shared/api-response";
import { loadScopedInvoice } from "./load-scoped-invoice";
import { buildSendOseInvoiceXml } from "./send-ose-xml";

type HandlerSet = {
	status?: number | string;
};

/**
 * handleSendInvoiceToOse operation.
 *
 * @param invoiceId - Input for invoiceId.
 * @param companyContext - Company-scoped context resolved by the guard.
 * @param set - Input for set.
 * @returns Result of handleSendInvoiceToOse.
 * @example
 * ```ts
 * const result = await handleSendInvoiceToOse("", {} as CompanyContext, {} as HandlerSet);
 * console.log(result);
 * ```
 */
export async function handleSendInvoiceToOse(
	invoiceId: string,
	companyContext: CompanyContext,
	set: HandlerSet,
): Promise<unknown> {
	try {
		const scopedInvoice = await loadScopedInvoice(invoiceId, companyContext);
		if (!scopedInvoice.ok) {
			set.status = scopedInvoice.status;
			return fail(scopedInvoice.error, scopedInvoice.code);
		}
		const { companyId, invoice } = scopedInvoice;

		if (invoice.status !== "DRAFT" && invoice.status !== "SENT") {
			set.status = 400;
			return fail(
				`Cannot send invoice with status ${invoice.status}. Only DRAFT or SENT invoices can be submitted to SUNAT.`,
				"INVOICE_INVALID_STATUS",
			);
		}

		const xmlContent = buildSendOseInvoiceXml(invoice);
		const transactionId =
			await ElectronicInvoicingService.resolveTransactionIdForInvoice(
				invoiceId,
			);

		if (!transactionId) {
			set.status = 404;
			return fail(
				"Invoice has no linked transaction for electronic invoicing",
				"INVOICE_TRANSACTION_NOT_FOUND",
			);
		}

		const electronicResult =
			await ElectronicInvoicingService.processElectronicInvoice({
				companyId,
				transactionId,
				xmlContent,
				invoiceNumber: invoice.invoiceNumber,
				invoiceType: invoice.series.startsWith("B") ? "03" : "01",
			});

		if (!electronicResult.success) {
			set.status = 500;
			return fail(
				electronicResult.error || "Error al enviar factura a OSE",
				"OSE_SEND_ERROR",
				electronicResult.runbook
					? {
							runbook: electronicResult.runbook as {
								id: string;
								title: string;
								path?: string;
							},
						}
					: undefined,
			);
		}

		return ok({
			invoiceId,
			transactionId,
			invoiceNumber: invoice.invoiceNumber,
			oseStatus: electronicResult.status,
			sunatCode: electronicResult.sunatCode,
			sunatDescription: electronicResult.sunatMessage,
			processingTime: electronicResult.processingTime,
		});
	} catch (error) {
		set.status = 500;
		return fail(
			error instanceof Error ? error.message : "Failed to send invoice to OSE",
			"OSE_SEND_ERROR",
		);
	}
}
