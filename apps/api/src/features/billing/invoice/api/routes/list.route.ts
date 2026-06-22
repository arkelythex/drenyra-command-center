import { Elysia } from "elysia";
import { z } from "zod";
import { fail, ok } from "../../../../shared/api-response";
import { listInvoices } from "../../application/queries/list-invoices.query";
import { loadInvoiceElectronicSummaries } from "../handlers/invoice-electronic-summary";

/**
 * Lists tenant invoices with filter and pagination support.
 *
 * @example
 * ```ts
 * app.use(listInvoicesRoute);
 * ```
 */
export const listInvoicesRoute = new Elysia().get(
	"/",
	async ({ query }) => {
		try {
			const result = await listInvoices({
				companyId: query.companyId,
				status: query.status,
				customerId: query.customerId,
				startDate: query.startDate ? new Date(query.startDate) : undefined,
				endDate: query.endDate ? new Date(query.endDate) : undefined,
				minAmount: query.minAmount ? Number(query.minAmount) : undefined,
				maxAmount: query.maxAmount ? Number(query.maxAmount) : undefined,
				search: query.search,
				limit: query.limit ? Number(query.limit) : 20,
				offset: query.offset ? Number(query.offset) : 0,
			});
			const electronicSummaries = await loadInvoiceElectronicSummaries(
				result.invoices,
			);

			return ok({
				invoices: result.invoices.map((inv) => {
					const electronicSummary = electronicSummaries.get(inv.id);

					return {
						id: inv.id,
						invoiceNumber: inv.invoiceNumber,
						customerId: inv.customerId,
						issueDate: inv.issueDate.toISOString(),
						dueDate: inv.dueDate.toISOString(),
						totalAmount: inv.totalAmount.toString(),
						balanceDue: inv.balanceDue.toString(),
						status: inv.status,
						currency: inv.currency,
						transactionId: electronicSummary?.transactionId ?? null,
						transactionStatus: electronicSummary?.transactionStatus ?? null,
						sunatCdr: inv.sunatCdr ?? null,
						sunatTicket: inv.sunatTicket ?? null,
						sunatStatus:
							electronicSummary?.sunatStatus ?? inv.sunatStatus ?? null,
						sunatCode: electronicSummary?.sunatCode ?? null,
						sunatMessage: electronicSummary?.sunatMessage ?? null,
					};
				}),
				total: result.total,
				limit: result.limit,
				offset: result.offset,
			});
		} catch (error) {
			return fail(
				error instanceof Error ? error.message : "Failed to list invoices",
				"FAILED_TO_LIST_INVOICES_ERROR",
			);
		}
	},
	{
		query: z.object({
			companyId: z.string().min(1),
			status: z
				.union([
					z.literal("DRAFT"),
					z.literal("SENT"),
					z.literal("PAID"),
					z.literal("OVERDUE"),
					z.literal("CANCELLED"),
				])
				.optional(),
			customerId: z.string().optional(),
			startDate: z.string().optional(),
			endDate: z.string().optional(),
			minAmount: z.string().optional(),
			maxAmount: z.string().optional(),
			search: z.string().max(50).optional(),
			limit: z.string().regex(/^\d+$/).optional(),
			offset: z.string().regex(/^\d+$/).optional(),
		}),
	},
);
