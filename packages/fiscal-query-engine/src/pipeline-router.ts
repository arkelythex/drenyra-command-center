/**
 * Fiscal Query Engine — Pipeline Router
 *
 * Maps an intent classification to the appropriate fiscal pipeline
 * or direct data lookup.
 */

import type { IntentClassification } from "./types";

/**
 * Route a classified intent to the execution path.
 * Returns which pipeline to run or if it's a direct lookup.
 */
export interface PipelineRoute {
	/** Whether a pipeline needs to be executed. */
	requiresPipeline: boolean;
	/** The pipeline ID to run (if requiresPipeline). */
	pipelineId?: string;
	/** Whether this is a direct DB query (no pipeline). */
	isDirectLookup: boolean;
	/** Description of what will be executed. */
	description: string;
}

/**
 * Map intent kind to execution route.
 */
export function routeIntent(
	classification: IntentClassification,
): PipelineRoute {
	switch (classification.kind) {
		case "igv-consulta":
		case "detracciones-consulta":
		case "sire-resumen":
		case "retenciones-consulta":
			return {
				requiresPipeline: true,
				pipelineId: `fiscal-${classification.kind}`,
				isDirectLookup: false,
				description: `Ejecutando análisis fiscal para: ${classification.kind} (${classification.extracted.periodo ?? "período no especificado"})`,
			};

		case "pipeline-run":
			return {
				requiresPipeline: true,
				pipelineId: "fiscal-full-sdd",
				isDirectLookup: false,
				description:
					"Ejecutando pipeline SDD completo (solicitud → análisis → diseño → plan → migración → auditoría)",
			};

		case "factura-lookup":
			return {
				requiresPipeline: false,
				isDirectLookup: true,
				description: "Buscando factura en base de datos...",
			};

		case "unknown":
			return {
				requiresPipeline: false,
				isDirectLookup: false,
				description: "No se pudo determinar la consulta.",
			};
	}
}
