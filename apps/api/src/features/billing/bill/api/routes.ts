/**
 * Bill Routes - API Layer
 * RESTful endpoints for bill (factura de compra) management.
 *
 * @layer API (Presentation)
 * @pattern REST + CQRS
 */

import { Elysia } from "elysia";
import { z } from "zod";
import { companyScopeGuard } from "../../../../shared/plugins";
import { resolveSessionContext } from "../../../security/session-context";
import { fail, ok } from "../../../shared/api-response";
import { BillMapper } from "../application/bill.mapper";
import { applyPayment } from "../application/commands/apply-payment.command";
import { createBill } from "../application/commands/create-bill.command";
import { deleteBill } from "../application/commands/delete-bill.command";
import { listBills } from "../application/queries/list-bills.query";
import {
	appendWorkflowEventToNotes,
	deriveApprovalState,
	extractWorkflowEventsFromNotes,
	stripWorkflowEventsFromNotes,
} from "../application/services/workflow-trace";
import type { BillDTO } from "../domain/bill.types";
import { BillRepository } from "../infrastructure/bill.repository";
import { loadScopedBill } from "./handlers/load-scoped-bill";

const ALLOWED_TRANSITIONS: Record<
	"DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED",
	Array<"DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED">
> = {
	DRAFT: ["SENT", "CANCELLED"],
	SENT: ["OVERDUE", "PAID", "CANCELLED"],
	OVERDUE: ["PAID", "CANCELLED"],
	PAID: [],
	CANCELLED: [],
};

function serializeBillDto(dto: BillDTO) {
	const workflowEvents = extractWorkflowEventsFromNotes(dto.notes);

	return {
		...dto,
		notes: stripWorkflowEventsFromNotes(dto.notes),
		workflowEvents,
		approvalState: deriveApprovalState(dto.status),
		issueDate: dto.issueDate.toISOString(),
		dueDate: dto.dueDate.toISOString(),
		createdAt: dto.createdAt.toISOString(),
		updatedAt: dto.updatedAt.toISOString(),
	};
}

/**
 * Bill API route module.
 *
 * @param headers - Caller headers used by object routes to resolve company scope.
 * @returns Elysia plugin for AP bill routes with scoped object access.
 * @throws Returns fail-closed API errors when bill scope validation fails.
 *
 * @example
 * ```ts
 * console.log(billRoutes);
 * ```
 */
export const billRoutes = new Elysia({ prefix: "/api/bills" })
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	// POST /api/bills - Create bill
	.post(
		"/",
		async ({ body, set }) => {
			try {
				const result = await createBill({
					companyId: body.companyId,
					vendorId: body.vendorId,
					billNumber: body.billNumber,
					issueDate: new Date(body.issueDate),
					dueDate: new Date(body.dueDate),
					currency: body.currency ?? "PEN",
					exchangeRate: body.exchangeRate ?? 1.0,
					...(body.notes !== undefined ? { notes: body.notes } : {}),
					...(body.tags !== undefined ? { tags: body.tags } : {}),
					items: body.items.map((item) => ({
						...(item.productId !== undefined
							? { productId: item.productId }
							: {}),
						description: item.description,
						quantity: item.quantity,
						unitPrice: item.unitPrice,
					})),
				});

				set.status = 201;
				return ok(result);
			} catch (error) {
				set.status = 400;
				return fail(
					error instanceof Error ? error.message : "Failed to create bill",
					"BILL_CREATE_ERROR",
				);
			}
		},
		{
			body: z.object({
				companyId: z.string().min(1),
				vendorId: z.string().min(1),
				billNumber: z.string().min(3).max(50),
				issueDate: z.string().date(),
				dueDate: z.string().date(),
				currency: z
					.union([z.literal("PEN"), z.literal("USD"), z.literal("EUR")])
					.optional(),
				exchangeRate: z.number().min(0).optional(),
				notes: z.string().max(500).optional(),
				tags: z.array(z.string()).max(20).optional(),
				items: z
					.array(
						z.object({
							productId: z.string().optional(),
							description: z.string().min(3).max(500),
							quantity: z.string().regex(/^\d+(\.\d{1,2})?$/),
							unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
						}),
					)
					.min(1)
					.max(100),
			}),
		},
	)

	// GET /api/bills - List bills
	.get(
		"/",
		async ({ query }) => {
			try {
				const result = await listBills({
					companyId: query.companyId,
					...(query.status !== undefined ? { status: query.status } : {}),
					...(query.vendorId !== undefined ? { vendorId: query.vendorId } : {}),
					...(query.startDate ? { startDate: new Date(query.startDate) } : {}),
					...(query.endDate ? { endDate: new Date(query.endDate) } : {}),
					...(query.search !== undefined ? { search: query.search } : {}),
					limit: query.limit ? Number(query.limit) : 20,
					offset: query.offset ? Number(query.offset) : 0,
				});

				return ok({
					bills: result.bills.map((bill) =>
						serializeBillDto(BillMapper.toDTO(bill)),
					),
					total: result.total,
					limit: result.limit,
					offset: result.offset,
				});
			} catch (error) {
				return fail(
					error instanceof Error ? error.message : "Failed to list bills",
					"BILL_LIST_ERROR",
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
				vendorId: z.string().optional(),
				startDate: z.string().date().optional(),
				endDate: z.string().date().optional(),
				search: z.string().max(50).optional(),
				limit: z.string().regex(/^\d+$/).optional(),
				offset: z.string().regex(/^\d+$/).optional(),
			}),
		},
	)

	// GET /api/bills/:id - Get bill by ID
	.get(
		"/:id",
		async ({ params, companyContext, set }) => {
			try {
				const scopedBill = await loadScopedBill(params.id, companyContext);
				if (!scopedBill.ok) {
					set.status = scopedBill.status;
					return fail(scopedBill.error, scopedBill.code);
				}

				const dto = BillMapper.toDTO(scopedBill.bill);
				return ok(serializeBillDto(dto));
			} catch (error) {
				set.status = 500;
				return fail(
					error instanceof Error ? error.message : "Failed to get bill",
					"BILL_GET_ERROR",
				);
			}
		},
		{
			params: z.object({ id: z.string().min(1) }),
		},
	)

	// PATCH /api/bills/:id/status - Update status with transition rules
	.patch(
		"/:id/status",
		async ({ params, body, headers, companyContext, set }) => {
			try {
				const scopedBill = await loadScopedBill(params.id, companyContext);
				if (!scopedBill.ok) {
					set.status = scopedBill.status;
					return fail(scopedBill.error, scopedBill.code);
				}

				const sessionContext = await resolveSessionContext({
					headers,
					requestedCompanyId: scopedBill.companyId,
					requireSession: true,
					securityProfile: "sensitive-write",
				});
				if (!sessionContext.ok) {
					set.status = sessionContext.status;
					return fail(sessionContext.error, sessionContext.code);
				}

				const legacyUserId = sessionContext.context.legacyUserId ?? undefined;

				if (body.actorId && body.actorId !== legacyUserId) {
					set.status = 403;
					return fail(
						"Body actorId does not match resolved caller identity",
						"AUTH_CONTEXT_MISMATCH",
					);
				}

				const repository = new BillRepository();
				const existing = scopedBill.bill;
				const allowed = ALLOWED_TRANSITIONS[existing.status] ?? [];
				if (!allowed.includes(body.status)) {
					set.status = 400;
					return fail(
						`Invalid status transition from ${existing.status} to ${body.status}`,
						"INVALID_STATUS_TRANSITION",
					);
				}

				const nextNotes = appendWorkflowEventToNotes(existing.notes, {
					at: new Date().toISOString(),
					from: existing.status,
					to: body.status,
					...(legacyUserId !== undefined ? { actorId: legacyUserId } : {}),
					...(body.actorName !== undefined ? { actorName: body.actorName } : {}),
					...(body.reason !== undefined ? { reason: body.reason } : {}),
					approvalState: deriveApprovalState(body.status),
				});

				await repository.updateStatus(
					params.id,
					body.status,
					nextNotes,
					legacyUserId,
				);
				return ok({
					status: body.status,
					approvalState: deriveApprovalState(body.status),
				});
			} catch (error) {
				set.status = 400;
				return fail(
					error instanceof Error
						? error.message
						: "Failed to update bill status",
					"BILL_STATUS_UPDATE_ERROR",
				);
			}
		},
		{
			params: z.object({ id: z.string().min(1) }),
			body: z.object({
				status: z.union([
					z.literal("DRAFT"),
					z.literal("SENT"),
					z.literal("PAID"),
					z.literal("OVERDUE"),
					z.literal("CANCELLED"),
				]),
				actorId: z.string().min(1).max(120).optional(),
				actorName: z.string().min(1).max(120).optional(),
				reason: z.string().min(1).max(240).optional(),
			}),
		},
	)

	// DELETE /api/bills/:id - Delete DRAFT bill
	.delete(
		"/:id",
		async ({ params, companyContext, set }) => {
			try {
				const scopedBill = await loadScopedBill(params.id, companyContext);
				if (!scopedBill.ok) {
					set.status = scopedBill.status;
					return fail(scopedBill.error, scopedBill.code);
				}

				await deleteBill({ id: scopedBill.bill.id });
				set.status = 204;
				return ok({ deleted: true });
			} catch (error) {
				set.status = 400;
				return fail(
					error instanceof Error ? error.message : "Failed to delete bill",
					"BILL_DELETE_ERROR",
				);
			}
		},
		{ params: z.object({ id: z.string().min(1) }) },
	)

	// POST /api/bills/:id/pay - Apply payment
	.post(
		"/:id/pay",
		async ({ params, body, headers, companyContext, set }) => {
			try {
				const repository = new BillRepository();
				const scopedBill = await loadScopedBill(params.id, companyContext);
				if (!scopedBill.ok) {
					set.status = scopedBill.status;
					return fail(scopedBill.error, scopedBill.code);
				}

				const sessionContext = await resolveSessionContext({
					headers,
					requestedCompanyId: scopedBill.companyId,
					requireSession: true,
					securityProfile: "sensitive-write",
				});
				if (!sessionContext.ok) {
					set.status = sessionContext.status;
					return fail(sessionContext.error, sessionContext.code);
				}

				const legacyUserId = sessionContext.context.legacyUserId ?? undefined;

				if (body.actorId && body.actorId !== legacyUserId) {
					set.status = 403;
					return fail(
						"Body actorId does not match resolved caller identity",
						"AUTH_CONTEXT_MISMATCH",
					);
				}

				const updated = await applyPayment({
					billId: params.id,
					amount: body.amount,
					currency: body.currency,
					...(legacyUserId !== undefined ? { legacyUserId } : {}),
					...(body.actorName !== undefined ? { actorName: body.actorName } : {}),
					...(body.reason !== undefined ? { reason: body.reason } : {}),
				});

				const persisted = await repository.findById(updated.id);
				const dto = BillMapper.toDTO(persisted ?? updated);
				return ok(serializeBillDto(dto));
			} catch (error) {
				set.status = 400;
				return fail(
					error instanceof Error ? error.message : "Failed to apply payment",
					"PAYMENT_APPLY_ERROR",
				);
			}
		},
		{
			params: z.object({ id: z.string().min(1) }),
			body: z.object({
				amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
				currency: z.union([
					z.literal("PEN"),
					z.literal("USD"),
					z.literal("EUR"),
				]),
				actorId: z.string().min(1).max(120).optional(),
				actorName: z.string().min(1).max(120).optional(),
				reason: z.string().min(1).max(240).optional(),
			}),
		},
	);

export default billRoutes;
