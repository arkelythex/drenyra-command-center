import { Elysia } from "elysia";
import { z } from "zod";
import { companyScopeGuard } from "../../../../../shared/plugins";
import { resolveSessionContext } from "../../../../security/session-context";
import { fail, ok } from "../../../../shared/api-response";
import { applyInvoicePayment } from "../../application/commands/apply-payment.command";
import { loadScopedInvoice } from "../handlers/load-scoped-invoice";

/**
 * Applies a payment to a tenant-scoped invoice.
 *
 * @example
 * ```ts
 * app.use(payInvoiceRoute);
 * ```
 */
export const payInvoiceRoute = new Elysia()
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.post(
		"/:id/pay",
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
					allowHeaderFallback: true,
					securityProfile: "sensitive-write",
				});
				if (!sessionContext.ok) {
					set.status = sessionContext.status;
					return fail(sessionContext.error, sessionContext.code);
				}

				await applyInvoicePayment({
					invoiceId: params.id,
					amount: body.amount,
					currency: body.currency,
				});

				return ok({
					message: "Payment applied successfully",
				});
			} catch (error) {
				set.status = 400;
				return fail(
					error instanceof Error ? error.message : "Failed to apply payment",
					"FAILED_TO_APPLY_PAYMENT_ERROR",
				);
			}
		},
		{
			params: z.object({
				id: z.string().min(1),
			}),
			body: z.object({
				amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
				currency: z.union([
					z.literal("PEN"),
					z.literal("USD"),
					z.literal("EUR"),
				]),
			}),
		},
	);
