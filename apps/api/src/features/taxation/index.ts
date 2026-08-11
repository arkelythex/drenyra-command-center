import { Elysia } from "elysia";
import { z } from "zod";
import { standardRateLimit } from "../../middleware/rate-limit.middleware";
import { companyScopeGuard } from "../../shared/plugins";
import { fail, ok } from "../shared/api-response";
import { safeFail } from "../shared/safe-error";
import {
	applyPercepcion,
	PercepcionApplyError,
} from "./application/commands/apply-percepcion.command";
import {
	applyRetention,
	RetentionApplyError,
} from "./application/commands/apply-retention.command";
import { cancelPercepcion } from "./application/commands/cancel-percepcion.command";
import { cancelRetention } from "./application/commands/cancel-retention.command";
import { declarePercepcion } from "./application/commands/declare-percepcion.command";
import { declareRetention } from "./application/commands/declare-retention.command";
import { markPercepcionPaid } from "./application/commands/mark-percepcion-paid.command";
import { markRetentionPaid } from "./application/commands/mark-retention-paid.command";
import { PercepcionLifecycleError } from "./application/errors/percepcion-lifecycle.error";
import { RetentionLifecycleError } from "./application/errors/retention-lifecycle.error";
import { getPendingPercepciones } from "./application/queries/get-pending-percepciones.query";
import { getPendingRetentions } from "./application/queries/get-pending-retentions.query";
import { getPercepcionSummary } from "./application/queries/get-percepcion-summary.query";
import { getRetentionSummary } from "./application/queries/get-retention-summary.query";
import { TaxationService } from "./application/services/taxation.service";
import { buildPdt621, Pdt621InputSchema } from "./pdt-621.service";

const taxationService = new TaxationService();

function handleRetentionCommandError(
	error: unknown,
	set: { status?: number | string | undefined },
): ReturnType<typeof fail> {
	if (error instanceof RetentionApplyError) {
		set.status = error.httpStatus;
		return fail(error.message, error.errorCode);
	}
	if (error instanceof RetentionLifecycleError) {
		set.status = error.httpStatus;
		return fail(error.message, error.errorCode);
	}
	set.status = 500;
	return safeFail(error, "INTERNAL_ERROR");
}

function handlePercepcionCommandError(
	error: unknown,
	set: { status?: number | string | undefined },
): ReturnType<typeof fail> {
	if (error instanceof PercepcionApplyError) {
		set.status = error.httpStatus;
		return fail(error.message, error.errorCode);
	}
	if (error instanceof PercepcionLifecycleError) {
		set.status = error.httpStatus;
		return fail(error.message, error.errorCode);
	}
	set.status = 500;
	return safeFail(error, "INTERNAL_ERROR");
}

/**
 * taxationModule const.
 *
 * @example
 * ```ts
 * console.log(taxationModule);
 * ```
 */
export const taxationModule = new Elysia({ prefix: "/api/taxation" })
	.use(standardRateLimit)
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.get(
		"/igv-summary",
		async ({ companyContext, query, set }) => {
			try {
				const result = await taxationService.getIGVSummary(
					companyContext?.companyId,
					Number(query.year),
					Number(query.month),
				);
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return safeFail(error, "INTERNAL_ERROR");
			}
		},
		{
			query: z.object({
				year: z.coerce.number().min(2000).max(2100),
				month: z.coerce.number().min(1).max(12),
			}),
			detail: {
				tags: ["Taxation"],
				summary: "IGV summary by period",
			},
		},
	)
	.get(
		"/income-tax",
		async ({ companyContext, query, set }) => {
			try {
				const result = await taxationService.getIncomeTaxProjection(
					companyContext?.companyId,
					Number(query.year),
				);
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return safeFail(error, "INTERNAL_ERROR");
			}
		},
		{
			query: z.object({
				year: z.coerce.number().min(2000).max(2100),
			}),
			detail: {
				tags: ["Taxation"],
				summary: "Income tax projection",
			},
		},
	)
	.get(
		"/detractions",
		async ({ companyContext, set }) => {
			try {
				const result = await taxationService.getDetractions(
					companyContext?.companyId,
				);
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return safeFail(error, "INTERNAL_ERROR");
			}
		},
		{
			query: z.object({}),
			detail: {
				tags: ["Taxation"],
				summary: "Pending detractions",
			},
		},
	)
	.get(
		"/calendar",
		async ({ companyContext, query, set }) => {
			try {
				const result = await taxationService.getTaxCalendar(
					companyContext?.companyId,
					Number(query.year),
				);
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return safeFail(error, "INTERNAL_ERROR");
			}
		},
		{
			query: z.object({
				year: z.coerce.number().min(2000).max(2100),
			}),
			detail: {
				tags: ["Taxation"],
				summary: "Tax calendar",
			},
		},
	)
	.post(
		"/pdt-621",
		({ body, set }) => {
			try {
				const result = buildPdt621(body);
				return ok(result);
			} catch (error: unknown) {
				set.status = 400;
				return safeFail(error, "VALIDATION_ERROR");
			}
		},
		{
			body: Pdt621InputSchema,
			detail: {
				tags: ["Taxation"],
				summary: "Generar PDT 621 (IGV-Renta Mensual)",
				description:
					"Calcula casillas 100/105/107/120/125/169/185 para declaración mensual. " +
					"Tributo resultante = IGV ventas - crédito fiscal - percepciones - retenciones. IGV 18% vigente 2026.",
			},
		},
	)

	// ── Retenciones (RS 037-2002/SUNAT — Agente de Retención) ────────────────

	.get(
		"/retenciones",
    		async ({ companyContext, query, set }) => {
    			try {
    				const companyId = companyContext?.companyId;
    				if (!companyId) {
    					set.status = 401;
    					return fail(
    						"Company context is required for retenciones",
    						"COMPANY_CONTEXT_REQUIRED",
    					);
    				}
    				const result = await getPendingRetentions({
    					companyId,
    					...(query.declarationPeriod !== undefined
    						? { declarationPeriod: query.declarationPeriod }
    						: {}),
    				});
    				return ok(result);
    			} catch (error: unknown) {
    				set.status = 500;
    				return safeFail(error, "INTERNAL_ERROR");
    			}
    		},
		{
			query: z.object({
				declarationPeriod: z
					.string()
					.regex(/^\d{4}-\d{2}$/)
					.optional(),
			}),
			detail: {
				tags: ["Taxation", "Retenciones"],
				summary: "Listar retenciones pendientes (PENDING/DECLARED)",
				description:
					"Retorna las retenciones 3% IGV aplicadas a facturas de proveedores. " +
					"Incluye días hasta vencimiento SUNAT (día 15 del mes siguiente). RS 037-2002.",
			},
		},
	)

	.get(
		"/retenciones/summary",
		async ({ companyContext, query, set }) => {
			try {
				const result = await getRetentionSummary({
					companyId: companyContext?.companyId,
					declarationPeriod: query.declarationPeriod,
				});
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return safeFail(error, "INTERNAL_ERROR");
			}
		},
		{
			query: z.object({
				declarationPeriod: z.string().regex(/^\d{4}-\d{2}$/),
			}),
			detail: {
				tags: ["Taxation", "Retenciones"],
				summary: "Resumen mensual para PDT 626",
				description:
					"Total de retenciones a declarar en PDT 626 para un período YYYY-MM. " +
					"Agrupa por estado (PENDING/DECLARED/PAID) y calcula el monto total.",
			},
		},
	)

	.post(
		"/retenciones",
		async ({ companyContext, body, set }) => {
			try {
				const result = await applyRetention({
					companyId: companyContext?.companyId,
					billId: body.billId,
					supplierRuc: body.supplierRuc,
					baseAmountCents: body.baseAmountCents,
				});
				set.status = 201;
				return ok(result);
			} catch (error: unknown) {
				return handleRetentionCommandError(error, set);
			}
		},
		{
			body: z.object({
				billId: z.string().min(1),
				supplierRuc: z.string().regex(/^\d{11}$/),
				/** Bill total in cents (integer). Must be > 70000 (S/ 700.00). */
				baseAmountCents: z.number().int().min(70001),
			}),
			detail: {
				tags: ["Taxation", "Retenciones"],
				summary: "Aplicar retención 3% a una factura de proveedor",
				description:
					"Crea una retención IGV del 3% sobre el monto base. Solo aplica a facturas > S/ 700 en PEN. " +
					"RS 037-2002/SUNAT. Emite evento taxation.retention.applied para ajuste automático del Cashflow.",
			},
		},
	)

	.patch(
		"/retenciones/:id/declare",
		async ({ params, body, set }) => {
			try {
				await declareRetention({
					retentionId: params.id,
					pdtReference: body.pdtReference,
				});
				return ok({ declared: true });
			} catch (error: unknown) {
				return handleRetentionCommandError(error, set);
			}
		},
		{
			params: z.object({ id: z.string().min(1) }),
			body: z.object({
				pdtReference: z.string().min(1),
			}),
			detail: {
				tags: ["Taxation", "Retenciones"],
				summary: "Marcar retención como declarada en PDT 626",
			},
		},
	)

	.patch(
		"/retenciones/:id/pay",
		async ({ params, body, set }) => {
			try {
				await markRetentionPaid({
					retentionId: params.id,
					bankTransactionId: body.bankTransactionId,
				});
				return ok({ paid: true });
			} catch (error: unknown) {
				return handleRetentionCommandError(error, set);
			}
		},
		{
			params: z.object({ id: z.string().min(1) }),
			body: z.object({
				bankTransactionId: z.string().min(1),
			}),
			detail: {
				tags: ["Taxation", "Retenciones"],
				summary: "Marcar retención como pagada a SUNAT",
				description:
					"Cierra la obligación PDT 626 asociando la transacción bancaria de pago.",
			},
		},
	)

	.patch(
		"/retenciones/:id/cancel",
		async ({ params, body, set }) => {
			try {
				await cancelRetention({
					retentionId: params.id,
					reason: body.reason,
				});
				return ok({ cancelled: true });
			} catch (error: unknown) {
				return handleRetentionCommandError(error, set);
			}
		},
		{
			params: z.object({ id: z.string().min(1) }),
			body: z.object({
				reason: z.string().min(5),
			}),
			detail: {
				tags: ["Taxation", "Retenciones"],
				summary: "Cancelar retención (ej. factura anulada)",
				description: "No aplica a retenciones ya pagadas a SUNAT.",
			},
		},
	)

	// ── Percepciones (DL N° 940 — Régimen de Percepciones IGV) ──────────────

	.get(
		"/percepciones",
    		async ({ companyContext, query, set }) => {
    			try {
    				const companyId = companyContext?.companyId;
    				if (!companyId) {
    					set.status = 401;
    					return fail(
    						"Company context is required for percepciones",
    						"COMPANY_CONTEXT_REQUIRED",
    					);
    				}
    				const result = await getPendingPercepciones({
    					companyId,
    					...(query.declarationPeriod !== undefined
    						? { declarationPeriod: query.declarationPeriod }
    						: {}),
    				});
    				return ok(result);
    			} catch (error: unknown) {
    				set.status = 500;
    				return safeFail(error, "INTERNAL_ERROR");
    			}
    		},
		{
			query: z.object({
				declarationPeriod: z
					.string()
					.regex(/^\d{4}-\d{2}$/)
					.optional(),
			}),
			detail: {
				tags: ["Taxation", "Percepciones"],
				summary: "Listar percepciones pendientes (PENDING/DECLARED)",
				description:
					"Retorna las percepciones IGV aplicadas a compras de Agentes de Percepción. " +
					"Incluye días hasta vencimiento SUNAT (día 15 del mes siguiente). DL N° 940.",
			},
		},
	)

	.get(
		"/percepciones/summary",
		async ({ companyContext, query, set }) => {
			try {
				const result = await getPercepcionSummary({
					companyId: companyContext?.companyId,
					declarationPeriod: query.declarationPeriod,
				});
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return safeFail(error, "INTERNAL_ERROR");
			}
		},
		{
			query: z.object({
				declarationPeriod: z.string().regex(/^\d{4}-\d{2}$/),
			}),
			detail: {
				tags: ["Taxation", "Percepciones"],
				summary: "Resumen mensual para declaración de percepciones",
				description:
					"Total de percepciones para un período YYYY-MM. " +
					"Agrupa por estado (PENDING/DECLARED/PAID) y calcula el monto total.",
			},
		},
	)

	.post(
		"/percepciones",
		async ({ companyContext, body, set }) => {
			try {
				const result = await applyPercepcion({
					companyId: companyContext?.companyId,
					billId: body.billId,
					agentRuc: body.agentRuc,
					percepcionType: body.percepcionType,
					totalAmountCents: body.totalAmountCents,
				});
				set.status = 201;
				return ok(result);
			} catch (error: unknown) {
				return handlePercepcionCommandError(error, set);
			}
		},
		{
			body: z.object({
				billId: z.string().min(1),
				agentRuc: z.string().regex(/^\d{11}$/),
				percepcionType: z.union([
					z.literal("VENTA_INTERNA"),
					z.literal("IMPORTACION"),
					z.literal("COMBUSTIBLE"),
				]),
				totalAmountCents: z.number().int().min(70000),
			}),
			detail: {
				tags: ["Taxation", "Percepciones"],
				summary: "Aplicar percepción IGV a una compra",
				description:
					"Crea una percepción IGV sobre el monto total de la factura de compra. " +
					"Tasa varía por tipo: 2% (VENTA_INTERNA), 3.5% (IMPORTACION), 1% (COMBUSTIBLE). " +
					"Solo aplica a facturas desde S/ 700 en PEN. DL N° 940.",
			},
		},
	)

	.patch(
		"/percepciones/:id/declare",
		async ({ params, body, set }) => {
			try {
				await declarePercepcion({
					percepcionId: params.id,
					pdtReference: body.pdtReference,
				});
				return ok({ declared: true });
			} catch (error: unknown) {
				return handlePercepcionCommandError(error, set);
			}
		},
		{
			params: z.object({ id: z.string().min(1) }),
			body: z.object({
				pdtReference: z.string().min(1),
			}),
			detail: {
				tags: ["Taxation", "Percepciones"],
				summary: "Marcar percepción como declarada en PDT",
			},
		},
	)

	.patch(
		"/percepciones/:id/pay",
		async ({ params, body, set }) => {
			try {
				await markPercepcionPaid({
					percepcionId: params.id,
					bankTransactionId: body.bankTransactionId,
				});
				return ok({ paid: true });
			} catch (error: unknown) {
				return handlePercepcionCommandError(error, set);
			}
		},
		{
			params: z.object({ id: z.string().min(1) }),
			body: z.object({
				bankTransactionId: z.string().min(1),
			}),
			detail: {
				tags: ["Taxation", "Percepciones"],
				summary: "Marcar percepción como pagada a SUNAT",
				description:
					"Cierra la obligación de declaración asociando la transacción bancaria de pago.",
			},
		},
	)

	.patch(
		"/percepciones/:id/cancel",
		async ({ params, body, set }) => {
			try {
				await cancelPercepcion({
					percepcionId: params.id,
					reason: body.reason,
				});
				return ok({ cancelled: true });
			} catch (error: unknown) {
				return handlePercepcionCommandError(error, set);
			}
		},
		{
			params: z.object({ id: z.string().min(1) }),
			body: z.object({
				reason: z.string().min(5),
			}),
			detail: {
				tags: ["Taxation", "Percepciones"],
				summary: "Cancelar percepción (ej. factura anulada)",
				description: "No aplica a percepciones ya pagadas a SUNAT.",
			},
		},
	);
