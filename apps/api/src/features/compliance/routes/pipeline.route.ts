/**
 * Compliance Pipeline Route — ejecuta el FiscalComplianceOrchestrator vía API.
 *
 * POST /api/compliance/pipeline/run
 *
 * Inicia un pipeline de cumplimiento fiscal para un cambio normativo.
 * El pipeline ejecuta: solicitud → análisis → diseño → plan → migración → auditoría
 * con gates, review guard, y compliance chains automáticas.
 *
 * @example
 * ```bash
 * curl -X POST /api/compliance/pipeline/run \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "changeId": "cambio-igv-001",
 *     "scope": {
 *       "organizationId": "org-1",
 *       "companyId": "comp-1",
 *       "companyRuc": "20123456786",
 *       "period": "2026-08"
 *     },
 *     "metadata": {
 *       "title": "IGV Rate Change 18% → 19%",
 *       "regulationRef": "Ley N° 12345",
 *       "description": "Actualización de tasa IGV"
 *     },
 *     "mode": "auto"
 *   }'
 * ```
 */

import { Elysia } from "elysia";
import { z } from "zod";
import { logger } from "../../../lib/logger";
import { resolveSessionContext } from "../../security/session-context";
import { fail, getErrorMessage, ok } from "../../shared/api-response";

// ============================================================================
// Schemas
// ============================================================================

const SCOPE_SCHEMA = z.object({
	organizationId: z.string().min(1, "organizationId requerido"),
	companyId: z.string().min(1, "companyId requerido"),
	companyRuc: z.string().length(11, "RUC debe tener 11 dígitos"),
	period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Formato YYYY-MM"),
});

const METADATA_SCHEMA = z
	.object({
		title: z.string().optional(),
		regulationRef: z.string().optional(),
		description: z.string().optional(),
	})
	.passthrough();

const RUN_REQUEST_SCHEMA = z.object({
	changeId: z.string().min(3, "changeId debe tener al menos 3 caracteres"),
	scope: SCOPE_SCHEMA,
	metadata: METADATA_SCHEMA.optional().default({}),
	mode: z
		.enum(["auto", "interactive", "supervised"])
		.optional()
		.default("auto"),
});

// ============================================================================
// Route
// ============================================================================

/**
 * pipelineRoute const.
 */
export const pipelineRoute = new Elysia({ prefix: "/pipeline" }).post(
	"/run",
	async ({ body, headers, set }) => {
		try {
			// Validar sesión
			const context = await resolveSessionContext({
				headers: headers as Record<string, unknown>,
				requestedCompanyId: body.scope.companyId,
				requireSession: true,
			});

			if (!context.ok) {
				set.status = context.status;
				return fail(context.error, context.code);
			}

			logger.info(
				{
					changeId: body.changeId,
					ruc: body.scope.companyRuc,
					period: body.scope.period,
					mode: body.mode,
					userId: context.context.legacyUserId,
				},
				"Fiscal compliance pipeline requested",
			);

			// ================================================================
			// Ejecutar pipeline
			// ================================================================
			//
			// NOTA: En producción, esto se ejecutaría de forma asíncrona
			// (encolado en un job). Por ahora, ejecutamos sincrónicamente
			// con un timeout razonable.
			//
			// El import dinámico evita que esta ruta dependa de fiscal-sdd
			// si el paquete no está disponible en el bundle del worker.
			//
			// ================================================================

			const { FiscalComplianceOrchestrator } = await import(
				"@drenyra/fiscal-sdd"
			);

			const orchestrator = new FiscalComplianceOrchestrator({
				mode: body.mode,
				artifactStore: "none",
				reviewBudget: 400,
			});

			const result = await orchestrator.run(
				body.changeId,
				body.scope,
				body.metadata,
			);

			const response = {
				changeId: result.changeId,
				status: result.status,
				blockedAtFase: result.blockedAtFase,
				message: result.message,
				reasons: result.reasons,
			};

			logger.info(
				{
					changeId: body.changeId,
					status: result.status,
					userId: context.context.legacyUserId,
				},
				"Fiscal compliance pipeline completed",
			);

			return ok(response);
		} catch (error: unknown) {
			const errorMessage = getErrorMessage(error);
			logger.error(
				{
					changeId: body?.changeId,
					error: errorMessage,
				},
				"Fiscal compliance pipeline failed",
			);
			set.status = 500;
			return fail(errorMessage, "PIPELINE_ERROR");
		}
	},
	{
		body: RUN_REQUEST_SCHEMA,
		detail: {
			tags: ["Compliance", "Fiscal Pipeline"],
			summary: "Ejecuta el pipeline de compliance fiscal (solicitud→auditoría)",
			description:
				"Inicia un pipeline de cumplimiento fiscal para un cambio normativo. " +
				"Ejecuta 6 fases secuenciales con gates, review guard, y compliance chains.",
		},
	},
);
