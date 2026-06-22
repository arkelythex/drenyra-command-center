import { Elysia } from "elysia";
import { z } from "zod";
import { companyScopeGuard } from "../../../../../shared/plugins";
import { fail, ok } from "../../../../shared/api-response";
import { deleteInvoice } from "../../application/commands/delete-invoice.command";
import { loadScopedInvoice } from "../handlers/load-scoped-invoice";

/**
 * Deletes a tenant-scoped invoice by id.
 *
 * @example
 * ```ts
 * app.use(deleteInvoiceRoute);
 * ```
 */
export const deleteInvoiceRoute = new Elysia()
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.delete(
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

				await deleteInvoice({ id: params.id });

				set.status = 204;
				return ok({ deleted: true });
			} catch (error) {
				set.status = 400;
				return fail(
					error instanceof Error ? error.message : "Failed to delete invoice",
					"FAILED_TO_DELETE_INVOICE_ERROR",
				);
			}
		},
		{
			params: z.object({
				id: z.string().min(1),
			}),
		},
	);
