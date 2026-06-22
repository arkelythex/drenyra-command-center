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
			sendElectronicInvoice(body, companyContext, set),
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
		({ body, headers, set }) => processCdrWebhook(body, headers, set),
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
