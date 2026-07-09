/**
 * Accountant Panel API Routes
 *
 * API endpoints for the accountant web interface.
 * Uses the real @drenyra/fiscal-approval store for recommendation management.
 *
 * Endpoints:
 * - GET  /api/accountant/summary          — dashboard summary
 * - GET  /api/approval/pending            — pending recommendations
 * - GET  /api/approval/:id                — recommendation detail
 * - POST /api/approval/:id/approve        — approve
 * - POST /api/approval/:id/reject         — reject
 */

import { Elysia, t } from "elysia";
import type { AccountantSummary } from "@drenyra/shared";
import { approvalStore } from "@drenyra/fiscal-approval";

// ─── Summary generator ──────────────────────────────────────────────────

function generateSummary(ruc: string, periodo: string): AccountantSummary {
	const pending = approvalStore.list({ status: "pending", ruc, periodo });
	return {
		ruc,
		periodo,
		igvCompra: 18234.5,
		igvVenta: 9876.0,
		detraccionesPendientes: 3,
		detraccionesMonto: 1200.0,
		pendingApprovals: pending.length,
		facturasCompra: 45,
		facturasVenta: 12,
	};
}

// ─── Module ─────────────────────────────────────────────────────────────

export function buildAccountantPanelModule() {
	return (
		new Elysia({ prefix: "/api" })
			// Dashboard summary
			.get(
				"/accountant/summary",
				({ query: { ruc, periodo } }) => {
					const summary = generateSummary(
						ruc ?? "20123456789",
						periodo ?? "2026-07",
					);
					return { ok: true, data: summary };
				},
				{
					query: t.Object({
						ruc: t.Optional(t.String()),
						periodo: t.Optional(t.String()),
					}),
					detail: {
						tags: ["Accountant"],
						description: "Dashboard fiscal summary",
					},
				},
			)

			// Pending recommendations (uses real approvalStore)
			.get(
				"/approval/pending",
				({ query: { ruc, periodo } }) => {
					const all = approvalStore.list({ ruc, periodo });
					const pending = all.filter((r) => r.status === "pending");
					const approved = all.filter((r) => r.status === "approved");
					const rejected = all.filter((r) => r.status === "rejected");
					const escalated = all.filter(
						(r) => r.status === "escalated" || r.status === "timeout",
					);

					return {
						ok: true,
						data: {
							total: all.length,
							pending: pending.length,
							approved: approved.length,
							rejected: rejected.length,
							escalated: escalated.length,
							recommendations: all,
						},
					};
				},
				{
					query: t.Object({
						ruc: t.Optional(t.String()),
						periodo: t.Optional(t.String()),
					}),
					detail: {
						tags: ["Approval"],
						description:
							"List pending recommendations using fiscal-approval store",
					},
				},
			)

			// Recommendation detail
			.get(
				"/approval/:id",
				({ params: { id }, set }) => {
					const rec = approvalStore.get(id);
					if (!rec) {
						set.status = 404;
						return { ok: false, error: `Recommendation ${id} not found` };
					}
					return { ok: true, data: rec };
				},
				{
					params: t.Object({ id: t.String() }),
					detail: {
						tags: ["Approval"],
						description: "Recommendation detail from fiscal-approval store",
					},
				},
			)

			// Approve recommendation
			.post(
				"/approval/:id/approve",
				({ params: { id }, set }) => {
					const rec = approvalStore.approve(id, "contador@drenyra");
					if (!rec) {
						set.status = 404;
						return {
							ok: false,
							error: `Recommendation ${id} not found or already processed`,
						};
					}
					return { ok: true, data: rec };
				},
				{
					params: t.Object({ id: t.String() }),
					detail: {
						tags: ["Approval"],
						description: "Approve recommendation via fiscal-approval store",
					},
				},
			)

			// Reject recommendation
			.post(
				"/approval/:id/reject",
				({ params: { id }, body, set }) => {
					if (!body.motivo?.trim()) {
						set.status = 400;
						return { ok: false, error: "Motivo es obligatorio para rechazar" };
					}
					const rec = approvalStore.reject(id, "contador@drenyra", body.motivo);
					if (!rec) {
						set.status = 404;
						return {
							ok: false,
							error: `Recommendation ${id} not found or already processed`,
						};
					}
					return { ok: true, data: rec };
				},
				{
					params: t.Object({ id: t.String() }),
					body: t.Object({ motivo: t.String({ minLength: 1 }) }),
					detail: {
						tags: ["Approval"],
						description: "Reject recommendation via fiscal-approval store",
					},
				},
			)
	);
}

export const accountantPanelModule = buildAccountantPanelModule();
