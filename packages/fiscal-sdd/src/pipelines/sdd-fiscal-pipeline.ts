/**
 * Fiscal Compliance Pipeline — Solicitud → Análisis → Diseño → Plan → Migración → Auditoría.
 *
 * Pipeline declarativo para gestión de cambios normativos fiscales.
 * Cada fase es revisable, con gates opcionales que validan el output
 * antes de pasar a la siguiente fase.
 *
 * @example
 * ```ts
 * import { FiscalSDDRunner } from '@drenyra/fiscal-sdd';
 * import { FISCAL_COMPLIANCE_PIPELINE } from '@drenyra/fiscal-sdd';
 *
 * const runner = new FiscalSDDRunner();
 * const result = await runner.runPipeline(FISCAL_COMPLIANCE_PIPELINE, solicitudInput, ctx);
 * ```
 */

import type { FiscalSDDPipeline, PhaseContext, PhaseResult } from "../types";

/** Placeholder phase — usado cuando no se inyecta un LLM caller. */
function placeholderPhase(name: string, description: string) {
	return {
		name,
		description,
		version: "1.0.0",
		execute: async (
			input: unknown,
			_ctx: PhaseContext,
		): Promise<PhaseResult> => ({
			status: "SUCCESS" as const,
			output: {
				fase: name,
				input,
				placeholder: true,
				ejecutadoEn: new Date().toISOString(),
			},
			gatesPassed: [],
			evidenceArtifacts: [],
			errors: [],
			confidence: 0.8,
		}),
	};
}

/**
 * Pipeline de Cumplimiento Fiscal.
 *
 * Fases secuenciales de gestión de cambio normativo.
 * Cuando se configura con LLM caller via createSolicitudPhase() etc.,
 * cada fase genera contenido real vía el modelo.
 */
export const FISCAL_COMPLIANCE_PIPELINE: FiscalSDDPipeline = {
	id: "fiscal-compliance-pipeline",
	name: "Pipeline de Cumplimiento Fiscal",
	description:
		"Ciclo de vida completo para cambios normativos fiscales: desde la solicitud hasta la auditoría",
	onGateBlocked: "STOP",
	phases: [
		placeholderPhase(
			"solicitud",
			"Solicitud de cambio normativo con justificación de negocio",
		),
		placeholderPhase(
			"analisis",
			"Análisis regulatorio citando la normativa aplicable",
		),
		placeholderPhase(
			"diseno",
			"Diseño de la implementación con decisiones arquitectónicas",
		),
		placeholderPhase(
			"plan",
			"Plan de migración con tareas desglosadas y estimaciones",
		),
		placeholderPhase(
			"migracion",
			"Ejecución de los cambios en los paquetes afectados",
		),
		placeholderPhase(
			"auditoria",
			"Auditoría de cumplimiento contra el análisis original",
		),
	],
};
