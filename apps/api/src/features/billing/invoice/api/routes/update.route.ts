import { Elysia } from "elysia";
import { z } from "zod";
import { companyScopeGuard } from "../../../../../shared/plugins";
import { fail, ok } from "../../../../shared/api-response";
import type { CreateInvoiceItemInput } from "../../application/commands/create-invoice.command";
import { updateInvoice } from "../../application/commands/update-invoice.command";
import { loadScopedInvoice } from "../handlers/load-scoped-invoice";

/**
 * Updates invoice metadata and line items in tenant scope.
 *
 * @example
 * ```ts
 * app.use(updateInvoiceRoute);
 * ```
 */
export const updateInvoiceRoute = new Elysia()
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.patch(
		"/:id",
		async ({ params, body, companyContext, set }: any) => {
			try {
				const scopedInvoice = await loadScopedInvoice(
					params.id,
					companyContext,
				);
				if (!scopedInvoice.ok) {
					set.status = scopedInvoice.status;
					return fail(scopedInvoice.error, scopedInvoice.code);
				}

				const updated = await updateInvoice({
					id: params.id,
					customerId: body.customerId,
					issueDate: new Date(body.issueDate),
					dueDate: new Date(body.dueDate),
					currency: body.currency,
					exchangeRate: body.exchangeRate ?? 1,
					notes: body.notes,
					items: body.items.map((item: CreateInvoiceItemInput) => ({
						productId: item.productId,
						description: item.description,
						quantity: item.quantity,
						unitPrice: item.unitPrice,
						taxType: item.taxType ?? "GRAVADO",
					})),
				});

				return ok({
					id: updated.id,
					invoiceNumber: updated.invoiceNumber,
					totalAmount: updated.totalAmount.toString(),
					status: updated.status,
				});
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Failed to update invoice";
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
				customerId: z.string().min(1),
				issueDate: z.string(),
				dueDate: z.string(),
				currency: z.union([
					z.literal("PEN"),
					z.literal("USD"),
					z.literal("EUR"),
				]),
				exchangeRate: z.number().min(0).optional(),
				notes: z.string().max(500).optional(),
				items: z
					.array(
						z.object({
							productId: z.string().optional(),
							description: z.string().min(3).max(255),
							quantity: z.string().regex(/^\d+(\.\d{1,2})?$/),
							unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
							taxType: z
								.union([
									z.literal("GRAVADO"),
									z.literal("EXONERADO"),
									z.literal("INAFECTO"),
								])
								.optional(),
						}),
					)
					.min(1)
					.max(50),
			}),
		},
	);
