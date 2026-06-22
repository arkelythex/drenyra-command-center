/**
 * SIRE API Route
 *
 * POST /sire-readiness, /sire-adversarial-audit endpoints
 *
 * @module ai-swarm/api/sire
 */

import { Elysia, t } from "elysia";
import { fail } from "../../shared/api-response";
import { SireAdversarialAuditService } from "../workflows/sire-adversarial-audit.service";
import { SireReadinessSubagentsService } from "../workflows/sire-readiness-subagents.service";
import { validateCompanyIdMatchesTenant } from "./organization-context";

const sireReadinessService = new SireReadinessSubagentsService();
const sireAdversarialAuditService = new SireAdversarialAuditService();

/**
 * AI Swarm routes
 * @example
 * ```ts
 * console.log(aiSwarmRoutes);
 * ```
 */

export const sireRoute = new Elysia({ prefix: "/api/ai-swarm" })
	/**
	 * POST /api/ai-swarm/sire-readiness
	 *
	 * Parallel subagents for SIRE readiness (IGV + RVIE/RCE consistency)
	 */
	.post(
		"/sire-readiness",
		async ({ body, request, set }) => {
			const tenantValidation = validateCompanyIdMatchesTenant({
				bodyCompanyId: body.companyId,
				headers: request.headers,
			});
			if (!tenantValidation.ok) {
				set.status = 400;
				return fail(tenantValidation.error, tenantValidation.code, {
					details: tenantValidation.details,
				});
			}

			const result = await sireReadinessService.run(body);
			return {
				success: true,
				data: result,
			};
		},
		{
			body: t.Object({
				companyId: t.String({ minLength: 1 }),
				period: t.String({ pattern: "^\\d{4}-(0[1-9]|1[0-2])$" }),
				declaredIgvPen: t.Number({ minimum: 0 }),
				salesTotalPen: t.Number({ minimum: 0 }),
				rvieRecords: t.Number({ minimum: 0 }),
				rceRecords: t.Number({ minimum: 0 }),
				pleSalesRecords: t.Number({ minimum: 0 }),
				plePurchaseRecords: t.Number({ minimum: 0 }),
			}),
			detail: {
				summary: "SIRE readiness with parallel subagents",
				description:
					"Ejecuta en paralelo subagente IGV y subagente RVIE/RCE para validar preparación previa al envío SIRE.",
				tags: ["AI Swarm"],
			},
		},
	)

	/**
	 * POST /api/ai-swarm/sire-adversarial-audit
	 *
	 * Agente A (creator) propone envio/reconciliacion.
	 * Agente B (destructor) emula alertas SUNAT AI y busca brechas.
	 * Arbitro decide con threshold dinamico anti-FP.
	 */
	.post(
		"/sire-adversarial-audit",
		async ({ body, request, set }) => {
			const tenantValidation = validateCompanyIdMatchesTenant({
				bodyCompanyId: body.companyId,
				headers: request.headers,
			});
			if (!tenantValidation.ok) {
				set.status = 400;
				return fail(tenantValidation.error, tenantValidation.code, {
					details: tenantValidation.details,
				});
			}

			const result = await sireAdversarialAuditService.run(body);
			return {
				success: true,
				data: result,
			};
		},
		{
			body: t.Object({
				companyId: t.String({ minLength: 1 }),
				ruc: t.String({ minLength: 11, maxLength: 11 }),
				period: t.String({ pattern: "^\\d{4}-(0[1-9]|1[0-2])$" }),
				declaredIgvPen: t.Number({ minimum: 0 }),
				salesTotalPen: t.Number({ minimum: 0 }),
				rvieRecords: t.Number({ minimum: 0 }),
				rceRecords: t.Number({ minimum: 0 }),
				pleSalesRecords: t.Number({ minimum: 0 }),
				plePurchaseRecords: t.Number({ minimum: 0 }),
				detractionAmountPen: t.Optional(t.Number({ minimum: 0 })),
				detractionableBasePen: t.Optional(t.Number({ minimum: 0 })),
				falsePositiveRate: t.Optional(t.Number({ minimum: 0, maximum: 0.99 })),
			}),
			detail: {
				summary: "SIRE adversarial audit (Creator vs Destructor + Arbiter)",
				description:
					"Ejecuta debate adversarial para SIRE: propuesta de conciliacion, emulacion SUNAT AI y decision final con threshold dinamico anti-falsos positivos.",
				tags: ["AI Swarm"],
			},
		},
	);
