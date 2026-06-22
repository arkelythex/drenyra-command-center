import { Elysia } from "elysia";
import { z } from "zod";
import {
	buildFiscalTruthAdvisoryTrace,
	registerFiscalTruthAdvisoryEvidence,
} from "../../../../fiscal/truth/trace";
import { fail, ok } from "../../../../shared/api-response";
import { createInvoice } from "../../application/commands/create-invoice.command";

/**
 * Creates a new invoice inside the tenant scope.
 *
 * @example
 * ```ts
 * app.use(createInvoiceRoute);
 * ```
 */
export const createInvoiceRoute = new Elysia().post(
	"/",
	async ({ body, set }) => {
		try {
			const advisoryTrace = buildFiscalTruthAdvisoryTrace({
				traceId: crypto.randomUUID(),
				source: "invoice",
				aggregateId: `${body.series}-${body.customerId}`,
				companyId: body.companyId,
			});
			registerFiscalTruthAdvisoryEvidence(advisoryTrace);

			const result = await createInvoice({
				companyId: body.companyId,
				customerId: body.customerId,
				series: body.series,
				issueDate: new Date(body.issueDate),
				dueDate: new Date(body.dueDate),
				currency: body.currency,
				exchangeRate: body.exchangeRate ?? 1,
				notes: body.notes,
				items: body.items.map((item) => ({
					productId: item.productId,
					description: item.description,
					quantity: item.quantity,
					unitPrice: item.unitPrice,
					taxType: item.taxType ?? "GRAVADO",
				})),
			});

			set.status = 201;
			return ok({
				id: result.invoiceId,
				invoiceNumber: result.invoiceNumber,
				totalAmount: result.totalAmount.amount,
				status: result.status,
			});
		} catch (error) {
			set.status = 400;
			return fail(
				error instanceof Error ? error.message : "Failed to create invoice",
				"FAILED_TO_CREATE_INVOICE_ERROR",
			);
		}
	},
	{
		body: z.object({
			companyId: z.string().min(1),
			customerId: z.string().min(1),
			series: z
				.string()
				.min(4)
				.max(4)
				.regex(/^[FB]\d{3}$/),
			issueDate: z.string(),
			dueDate: z.string(),
			currency: z.union([z.literal("PEN"), z.literal("USD"), z.literal("EUR")]),
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
