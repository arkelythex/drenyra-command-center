import { Elysia } from "elysia";
import { z } from "zod";
import { companyScopeGuard } from "../../../../../shared/plugins";
import { fail, ok } from "../../../../shared/api-response";
import { loadInvoiceElectronicSummaries } from "../handlers/invoice-electronic-summary";
import { serializeInvoice } from "../handlers/invoice-response";
import { loadScopedInvoice } from "../handlers/load-scoped-invoice";

/**
 * Returns one tenant-scoped invoice by id.
 *
 * @example
 * ```ts
 * app.use(getInvoiceRoute);
 * ```
 */
export const getInvoiceRoute = new Elysia()
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.get(
		"/:id",
		async ({ params, companyContext, set }: any) => {
			try {
				const scopedInvoice = await loadScopedInvoice(
					params.id,
					companyContext,
				);
				if (!scopedInvoice.ok) {
					set.status = scopedInvoice.status;
					return fail(scopedInvoice.error, scopedInvoice.code);
				}

				const summaries = await loadInvoiceElectronicSummaries([
					scopedInvoice.invoice,
				]);

				return ok(
					serializeInvoice(
						scopedInvoice.invoice,
						summaries.get(scopedInvoice.invoice.id),
					),
				);
			} catch (error) {
				set.status = 500;
				return fail(
					error instanceof Error ? error.message : "Failed to get invoice",
					"FAILED_TO_GET_INVOICE_ERROR",
				);
			}
		},
		{
			params: z.object({
				id: z.string().min(1),
			}),
		},
	);
