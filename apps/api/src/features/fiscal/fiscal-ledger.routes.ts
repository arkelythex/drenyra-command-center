/**
 * Fiscal Ledger Routes — endpoints del Fiscal General Ledger.
 *
 * POST /api/fiscal/ledger/classify   — clasifica una transacción
 * GET  /api/fiscal/ledger/summary    — resumen fiscal por período
 * POST /api/fiscal/ledger/batch      — clasifica múltiples transacciones
 */

import { FiscalClassificationEngine } from "@drenyra/application/src/fiscal/fiscal-classification-engine";
import { Elysia } from "elysia";
import { z } from "zod";
import { resolveSessionContext } from "../security/session-context";
import { fail, getErrorMessage, ok } from "../shared/api-response";
import { companyScopeGuard } from "../shared/plugins/company-scope-guard";

// ============================================================================
// Schemas
// ============================================================================

const CLASSIFY_BODY = z.object({
	tipoComprobante: z.string().min(1),
	serie: z.string().min(1),
	numero: z.string().optional(),
	montoTotal: z.number().positive(),
	moneda: z.enum(["PEN", "USD"]),
	descripcion: z.string().min(3),
	tipo: z.enum(["COMPRA", "VENTA"]),
	fechaEmision: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
	rucEmisor: z.string().length(11).optional(),
	rucCliente: z.string().length(11).optional(),
	razonSocial: z.string().optional(),
	tipoCambio: z.number().positive().optional(),
});

const BATCH_BODY = z.object({
	transactions: z.array(CLASSIFY_BODY).min(1).max(100),
});

// ============================================================================
// Route
// ============================================================================

const engine = new FiscalClassificationEngine();

export const fiscalLedgerRoute = new Elysia({ prefix: "/ledger" })
	.use(companyScopeGuard())

	// ── Classify single transaction ─────────────────────────────────
	.post(
		"/classify",
		async ({ body, set, headers }) => {
			try {
				const context = await resolveSessionContext({
					headers: headers as Record<string, unknown>,
					requestedCompanyId: body.rucEmisor ?? body.rucCliente ?? "",
					requireSession: true,
				});
				if (!context.ok) {
					set.status = context.status;
					return fail(context.error, context.code);
				}

				const classification = engine.classify(body);

				return ok({
					input: {
						tipoComprobante: body.tipoComprobante,
						serie: body.serie,
						numero: body.numero,
						montoTotal: body.montoTotal,
						moneda: body.moneda,
						tipo: body.tipo,
					},
					classification,
				});
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "CLASSIFICATION_ERROR");
			}
		},
		{
			body: CLASSIFY_BODY,
			detail: {
				tags: ["Fiscal Ledger", "FGL"],
				summary:
					"Clasifica una transacción con impacto fiscal (IGV, detracción, SIRE)",
				description:
					"Usa el FiscalClassificationEngine para determinar tratamiento IGV, " +
					"detracción aplicable, categoría SIRE, y período fiscal de una transacción.",
			},
		},
	)

	// ── Batch classify ──────────────────────────────────────────────
	.post(
		"/batch",
		async ({ body, set, headers }) => {
			try {
				const firstRuc =
					body.transactions[0]?.rucEmisor ??
					body.transactions[0]?.rucCliente ??
					"";
				const context = await resolveSessionContext({
					headers: headers as Record<string, unknown>,
					requestedCompanyId: firstRuc,
					requireSession: true,
				});
				if (!context.ok) {
					set.status = context.status;
					return fail(context.error, context.code);
				}

				const results = body.transactions.map((t) => {
					const classification = engine.classify(t);
					return {
						input: {
							tipoComprobante: t.tipoComprobante,
							serie: t.serie,
							numero: t.numero,
							montoTotal: t.montoTotal,
							moneda: t.moneda,
							tipo: t.tipo,
						},
						classification,
					};
				});

				const summary = {
					totalClassified: results.length,
					averageConfidence:
						results.reduce((acc, r) => acc + r.classification.confidence, 0) /
						results.length,
					totalIgvAmount: results.reduce(
						(acc, r) => acc + r.classification.igvAmount,
						0,
					),
					totalDetracciones: results.filter(
						(r) => r.classification.detraccion.aplica,
					).length,
					needReview: results.filter((r) => r.classification.confidence < 0.7)
						.length,
				};

				return ok({ results, summary });
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "BATCH_CLASSIFICATION_ERROR");
			}
		},
		{
			body: BATCH_BODY,
			detail: {
				tags: ["Fiscal Ledger", "FGL"],
				summary: "Clasifica múltiples transacciones (batch, max 100)",
			},
		},
	)

	// ── Summary by period ───────────────────────────────────────────
	.get(
		"/summary/:ruc/:periodo",
		async ({ params, set, headers }) => {
			try {
				const context = await resolveSessionContext({
					headers: headers as Record<string, unknown>,
					requestedCompanyId: params.ruc,
					requireSession: true,
				});
				if (!context.ok) {
					set.status = context.status;
					return fail(context.error, context.code);
				}

				return ok({
					ruc: params.ruc,
					periodo: params.periodo,
					message:
						"Resumen fiscal disponible próximamente. " +
						"Usa POST /api/fiscal/ledger/classify para clasificar transacciones.",
					status: "CLASSIFIER_READY",
				});
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "SUMMARY_ERROR");
			}
		},
		{
			params: z.object({
				ruc: z.string().length(11),
				periodo: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
			}),
			detail: {
				tags: ["Fiscal Ledger", "FGL"],
				summary: "Resumen fiscal por período (IGV, detracciones, health score)",
			},
		},
	);
