import { Elysia } from "elysia";
import { companyScopeGuard } from "../../../shared/plugins";
import {
	getInvoiceLifecycle,
	getTransactionLifecycle,
} from "../application/queries/get-transaction-lifecycle.query";
import {
	invoiceLifecycleParamsSchema,
	transactionLifecycleParamsSchema,
} from "../schemas";

/**
 * electronicInvoicingLifecycleRoutes const.
 *
 * @example
 * ```ts
 * console.log(electronicInvoicingLifecycleRoutes);
 * ```
 */
export const electronicInvoicingLifecycleRoutes = new Elysia()
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.get(
		"/lifecycle/:transactionId",
		({ params, companyContext, set }) =>
			getTransactionLifecycle(params.transactionId, companyContext, set),
		{
			params: transactionLifecycleParamsSchema,
			detail: {
				summary: "Obtener trazabilidad CPE por transacción",
				description:
					"Devuelve estados de sistema/SUNAT y timeline del ciclo de facturación electrónica. Requiere header X-Company-Id para aislar tenant.",
				tags: ["Electronic Invoicing", "Compliance", "Traceability"],
			},
		},
	)
	.get(
		"/lifecycle/invoice/:invoiceId",
		({ params, companyContext, set }) =>
			getInvoiceLifecycle(params.invoiceId, companyContext, set),
		{
			params: invoiceLifecycleParamsSchema,
			detail: {
				summary: "Obtener trazabilidad CPE por factura",
				description:
					"Resuelve la transacción asociada por serie/correlativo y devuelve timeline de estados. Requiere header X-Company-Id para aislar tenant.",
				tags: ["Electronic Invoicing", "Compliance", "Traceability"],
			},
		},
	);
