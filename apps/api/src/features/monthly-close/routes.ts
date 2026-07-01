import type { CloseChecklistRepository } from "@arkelythex/domain/repositories/close-checklist.repository";
import { Elysia, t } from "elysia";
import { fail, getErrorMessage, ok } from "../shared/api-response";
import { MonthlyCloseController } from "./controller";
import {
	AttachEvidenceSchema,
	ChecklistQuerySchema,
	CreateChecklistSchema,
	CreateItemSchema,
	DashboardQuerySchema,
	GateQuerySchema,
	OverrideGateSchema,
	PeriodsQuerySchema,
	UpdateChecklistSchema,
	UpdateItemSchema,
} from "./types";

export const createMonthlyCloseRoutes = (repo: CloseChecklistRepository) => {
	const ctrl = new MonthlyCloseController(repo);

	return (
		new Elysia({ prefix: "/api/v1/close" })
			// --- Checklists ---
			.post(
				"/checklists",
				async ({ body, set }) => {
					try {
						const result = await ctrl.createChecklist(body);
						set.status = 201;
						return ok(result);
					} catch (error) {
						set.status = 500;
						return fail(getErrorMessage(error), "CHECKLIST_CREATE_ERROR");
					}
				},
				{
					body: CreateChecklistSchema,
					detail: {
						tags: ["Monthly Close"],
						summary: "Create checklist for period",
					},
				},
			)
			.get(
				"/checklists",
				async ({ query, set }) => {
					try {
						const result = await ctrl.listChecklists(
							query.companyId,
							query.period,
						);
						return ok(result);
					} catch (error) {
						set.status = 500;
						return fail(getErrorMessage(error), "CHECKLIST_LIST_ERROR");
					}
				},
				{
					query: ChecklistQuerySchema,
					detail: {
						tags: ["Monthly Close"],
						summary: "List checklists by company/period",
					},
				},
			)
			.get(
				"/checklists/:id",
				async ({ params, set }) => {
					try {
						const result = await ctrl.getChecklist(params.id);
						if (!result) {
							set.status = 404;
							return fail("Checklist not found", "CHECKLIST_NOT_FOUND");
						}
						return ok(result);
					} catch (error) {
						set.status = 500;
						return fail(getErrorMessage(error), "CHECKLIST_GET_ERROR");
					}
				},
				{
					params: t.Object({ id: t.String() }),
					detail: {
						tags: ["Monthly Close"],
						summary: "Get checklist detail with items",
					},
				},
			)
			.patch(
				"/checklists/:id",
				async ({ params, body, set }) => {
					try {
						const result = await ctrl.updateChecklist(params.id, body);
						if (!result) {
							set.status = 404;
							return fail("Checklist not found", "CHECKLIST_NOT_FOUND");
						}
						return ok(result);
					} catch (error) {
						set.status = 500;
						return fail(getErrorMessage(error), "CHECKLIST_UPDATE_ERROR");
					}
				},
				{
					params: t.Object({ id: t.String() }),
					body: UpdateChecklistSchema,
					detail: {
						tags: ["Monthly Close"],
						summary: "Update checklist metadata",
					},
				},
			)
			// --- Items ---
			.post(
				"/checklists/:id/items",
				async ({ params, body, set }) => {
					try {
						const result = await ctrl.addItem(params.id, body);
						set.status = 201;
						return ok(result);
					} catch (error) {
						set.status = 500;
						return fail(getErrorMessage(error), "ITEM_CREATE_ERROR");
					}
				},
				{
					params: t.Object({ id: t.String() }),
					body: CreateItemSchema,
					detail: {
						tags: ["Monthly Close"],
						summary: "Add item to checklist",
					},
				},
			)
			.patch(
				"/items/:id",
				async ({ params, body, set }) => {
					try {
						const result = await ctrl.updateItem(params.id, body);
						if (!result) {
							set.status = 404;
							return fail("Item not found", "ITEM_NOT_FOUND");
						}
						return ok(result);
					} catch (error) {
						set.status = 500;
						return fail(getErrorMessage(error), "ITEM_UPDATE_ERROR");
					}
				},
				{
					params: t.Object({ id: t.String() }),
					body: UpdateItemSchema,
					detail: {
						tags: ["Monthly Close"],
						summary: "Update item status (complete, waive)",
					},
				},
			)
			.post(
				"/items/:id/evidence",
				async ({ params, body, set }) => {
					try {
						const result = await ctrl.attachEvidence(
							params.id,
							body.evidenceId,
						);
						if (!result) {
							set.status = 404;
							return fail("Item not found", "ITEM_NOT_FOUND");
						}
						return ok(result);
					} catch (error) {
						set.status = 500;
						return fail(getErrorMessage(error), "EVIDENCE_ATTACH_ERROR");
					}
				},
				{
					params: t.Object({ id: t.String() }),
					body: AttachEvidenceSchema,
					detail: {
						tags: ["Monthly Close"],
						summary: "Attach evidence to item",
					},
				},
			)
			// --- Gates ---
			.get(
				"/gates",
				async ({ query, set }) => {
					try {
						const result = await ctrl.getGates(query.companyId, query.period);
						return ok(result);
					} catch (error) {
						set.status = 500;
						return fail(getErrorMessage(error), "GATES_LIST_ERROR");
					}
				},
				{
					query: GateQuerySchema,
					detail: {
						tags: ["Monthly Close"],
						summary: "Get gates for period",
					},
				},
			)
			.patch(
				"/gates/:id",
				async ({ params, body, set }) => {
					try {
						const result = await ctrl.overrideGate(
							params.id,
							body.status,
							body.resolution,
							body.overrideById,
						);
						if (!result) {
							set.status = 404;
							return fail("Gate not found", "GATE_NOT_FOUND");
						}
						return ok(result);
					} catch (error) {
						set.status = 500;
						return fail(getErrorMessage(error), "GATE_OVERRIDE_ERROR");
					}
				},
				{
					params: t.Object({ id: t.String() }),
					body: OverrideGateSchema,
					detail: {
						tags: ["Monthly Close"],
						summary: "Override gate with resolution reason",
					},
				},
			)
			// --- Dashboard & Periods ---
			.get(
				"/dashboard",
				async ({ query, set }) => {
					try {
						const result = await ctrl.getDashboard(
							query.companyId,
							query.period,
						);
						return ok(result);
					} catch (error) {
						set.status = 500;
						return fail(getErrorMessage(error), "DASHBOARD_ERROR");
					}
				},
				{
					query: DashboardQuerySchema,
					detail: {
						tags: ["Monthly Close"],
						summary: "Close dashboard with progress, gates, overdue",
					},
				},
			)
			.get(
				"/periods",
				async ({ query, set }) => {
					try {
						const count = await ctrl.getPeriods(query.companyId);
						return ok({ total: count });
					} catch (error) {
						set.status = 500;
						return fail(getErrorMessage(error), "PERIODS_ERROR");
					}
				},
				{
					query: PeriodsQuerySchema,
					detail: {
						tags: ["Monthly Close"],
						summary: "List periods with close status",
					},
				},
			)
	);
};
