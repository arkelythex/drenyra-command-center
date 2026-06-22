import { Elysia } from "elysia";
import { z } from "zod";
import { companyScopeGuard } from "../../../../../shared/plugins";
import { handleSendInvoiceToOse } from "../handlers/send-ose.handler";

/**
 * Sends an invoice through the OSE/SUNAT pipeline.
 *
 * @example
 * ```ts
 * app.use(sendOseInvoiceRoute);
 * ```
 */
export const sendOseInvoiceRoute = new Elysia()
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.post(
		"/:id/send-ose",
		({ params, companyContext, set }: any) =>
			handleSendInvoiceToOse(params.id, companyContext, set),
		{
			params: z.object({
				id: z.string().min(1),
			}),
			detail: {
				tags: ["Invoices", "Electronic Invoicing"],
				summary: "Send invoice to SUNAT via OSE",
				description:
					"Routes the selected invoice through the unified electronic invoicing pipeline. Requires X-Company-Id tenant scope.",
			},
		},
	);
