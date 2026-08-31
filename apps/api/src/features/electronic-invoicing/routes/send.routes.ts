import { Elysia } from "elysia";
import { companyScopeGuard } from "../../../shared/plugins";
import { processCdrWebhook } from "../application/commands/process-cdr-webhook.command";
import { sendElectronicInvoice } from "../application/commands/send-electronic-invoice.command";
import {
	cdrWebhookBodySchema,
	sendElectronicInvoiceBodySchema,
} from "../schemas";

/**
 * electronicInvoicingSendRoutes const.
 *
 * @example
 * ```ts
 * console.log(electronicInvoicingSendRoutes);
 * ```
 */
export const electronicInvoicingSendRoutes = new Elysia()
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.post(
		"/send",
		({ body, companyContext, set }) =>
			sendElectronicInvoice(
				{
					transactionId: body.transactionId,
					xmlContent: body.xmlContent,
					invoiceNumber: body.invoiceNumber,
					invoiceType: body.invoiceType,
					...(body.priority !== undefined ? { priority: body.priority } : {}),
					...(body.governance !== undefined
						? { governance: body.governance }
						: {}),
				},
				companyContext,
				set,
			),
		{
			body: sendElectronicInvoiceBodySchema,
			detail: {
				summary: "Enviar factura electrónica a SUNAT",
				description:
					"Procesa una transacción completa: valida XML UBL 2.1, firma digitalmente, envía a OSE y procesa respuesta SUNAT. Requiere header X-Company-Id para aislar tenant.",
				tags: ["Electronic Invoicing"],
			},
		},
	)
	.post(
		"/webhooks/cdr",
		({ body, headers, set }) =>
			processCdrWebhook(
				{
					invoiceNumber: body.invoiceNumber,
					cdrStatus: body.cdrStatus,
					...(body.transactionId !== undefined
						? { transactionId: body.transactionId }
						: {}),
					...(body.sunatCode !== undefined
						? { sunatCode: body.sunatCode }
						: {}),
					...(body.sunatDescription !== undefined
						? { sunatDescription: body.sunatDescription }
						: {}),
					...(body.cdrContent !== undefined
						? { cdrContent: body.cdrContent }
						: {}),
					...(body.providerReference !== undefined
						? { providerReference: body.providerReference }
						: {}),
					...(body.occurredAt !== undefined
						? { occurredAt: body.occurredAt }
						: {}),
				},
				headers,
				set,
			),
		{
			body: cdrWebhookBodySchema,
			detail: {
				summary: "Webhook CDR OSE",
				description:
					"Recibe la constancia de recepción (CDR) asíncrona desde OSE y actualiza estado de transacción",
				tags: ["Electronic Invoicing", "Webhooks"],
			},
		},
	);
