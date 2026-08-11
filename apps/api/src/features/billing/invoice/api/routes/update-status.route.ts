import { Elysia } from "elysia";
import { z } from "zod";
import { companyScopeGuard } from "../../../../../shared/plugins";
import { resolveSessionContext } from "../../../../security/session-context";
import { fail, ok } from "../../../../shared/api-response";
import { updateInvoiceStatus } from "../../application/commands/update-invoice-status.command";
import { loadScopedInvoice } from "../handlers/load-scoped-invoice";

/**
 * Updates lifecycle status for a tenant-scoped invoice.
 *
 * @example
 * ```ts
 * app.use(updateInvoiceStatusRoute);
 * ```
 */
export const updateInvoiceStatusRoute = new Elysia()
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.patch(
		"/:id/status",
		async ({ params, body, headers, companyContext, set }: any) => {
			try {
				const scopedInvoice = await loadScopedInvoice(
					params.id,
					companyContext,
				);
				if (!scopedInvoice.ok) {
					set.status = scopedInvoice.status;
					return fail(scopedInvoice.error, scopedInvoice.code);
				}

				const sessionContext = await resolveSessionContext({
					headers,
					requestedCompanyId: scopedInvoice.companyId,
					requireSession: true,
					securityProfile: "sensitive-write",
				});
				if (!sessionContext.ok) {
					set.status = sessionContext.status;
					return fail(sessionContext.error, sessionContext.code);
				}

				await updateInvoiceStatus({
					id: params.id,
					status: body.status,
					...(sessionContext.context.legacyUserId !== undefined
						? { legacyUserId: sessionContext.context.legacyUserId }
						: {}),
				});

				return ok({ updated: true });
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: "Failed to update invoice status";
				set.status = message === "Invoice not found" ? 404 : 400;
				return fail(
					message,
					message === "Invoice not found"
						? "INVOICE_NOT_FOUND"
						: "INVOICE_UPDATE_ERROR",
				);
			}
		},
		{
			params: z.object({
				id: z.string().min(1),
			}),
			body: z.object({
				status: z.union([
					z.literal("DRAFT"),
					z.literal("SENT"),
					z.literal("PAID"),
					z.literal("OVERDUE"),
					z.literal("CANCELLED"),
				]),
			}),
		},
	);
