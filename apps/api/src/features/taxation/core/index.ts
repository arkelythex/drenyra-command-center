import { Elysia } from "elysia";
import { z } from "zod";
import { ok } from "../../shared/api-response";
import { safeFail } from "../../shared/safe-error";
import { buildPdt621, Pdt621InputSchema } from "../pdt-621.service";
import {
	applyPercepcion,
	applyRetention,
	cancelPercepcion,
	cancelRetention,
	declarePercepcion,
	declareRetention,
	getPendingPercepciones,
	getPendingRetentions,
	getPercepcionSummary,
	getRetentionSummary,
	markPercepcionPaid,
	markRetentionPaid,
	taxationService,
} from "./calculator";
import {
	handlePercepcionCommandError,
	handleRetentionCommandError,
} from "./validators";

export const taxationModule = new Elysia({ prefix: "/api/taxation" })
	.get(
		"/igv-summary",
		async ({ query, set }) => {
			try {
				const result = await taxationService.getIGVSummary(
					query.companyId,
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
				companyId: z.string().min(1),
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
		async ({ query, set }) => {
			try {
				const result = await taxationService.getIncomeTaxProjection(
					query.companyId,
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
				companyId: z.string().min(1),
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
		async ({ query, set }) => {
			try {
				const result = await taxationService.getDetractions(query.companyId);
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return safeFail(error, "INTERNAL_ERROR");
			}
		},
		{
			query: z.object({
				companyId: z.string().min(1),
			}),
			detail: {
				tags: ["Taxation"],
				summary: "Pending detractions",
			},
		},
	)
	.get(
		"/calendar",
		async ({ query, set }) => {
			try {
				const result = await taxationService.getTaxCalendar(
					query.companyId,
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
				companyId: z.string().min(1),
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
		async ({ query, set }) => {
			try {
				const result = await getPendingRetentions({
					companyId: query.companyId,
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
				companyId: z.string().min(1),
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
		async ({ query, set }) => {
			try {
				const result = await getRetentionSummary({
					companyId: query.companyId,
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
				companyId: z.string().min(1),
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
		async ({ body, set }) => {
			try {
				const result = await applyRetention({
					companyId: body.companyId,
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
				companyId: z.string().min(1),
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
		async ({ query, set }) => {
			try {
				const result = await getPendingPercepciones({
					companyId: query.companyId,
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
				companyId: z.string().min(1),
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
		async ({ query, set }) => {
			try {
				const result = await getPercepcionSummary({
					companyId: query.companyId,
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
				companyId: z.string().min(1),
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
		async ({ body, set }) => {
			try {
				const result = await applyPercepcion({
					companyId: body.companyId,
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
				companyId: z.string().min(1),
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
