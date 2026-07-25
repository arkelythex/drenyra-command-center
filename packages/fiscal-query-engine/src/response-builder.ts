/**
 * Fiscal Query Engine — Response Builder
 *
 * Builds a QueryResult from an IntentClassification and pipeline output.
 */

import type {
	EvidenceRef,
	EvidenceSource,
	IntentClassification,
	QueryResult,
} from "./types";

/**
 * Build a complete query result from classification and pipeline data.
 */
export function buildQueryResult(
	classification: IntentClassification,
	pipelineOutput: Record<string, unknown> | null,
	options?: {
		fuentes?: EvidenceSource[];
		evidenceRefs?: EvidenceRef[];
		error?: string;
		sugerencia?: string;
	},
): QueryResult {
	const resultado = pipelineOutput ?? {};

	return {
		tipo: classification.kind,
		ruc: classification.extracted.ruc ?? "",
		periodo: classification.extracted.periodo ?? "",
		resultado,
		confianza: classification.confidence,
		fuentes: options?.fuentes ?? [],
		evidenceArtifacts: options?.evidenceRefs ?? [],
		error: options?.error,
		sugerencia: options?.sugerencia,
	};
}

/**
 * Build an error response for ambiguous or failed queries.
 */
export function buildErrorResponse(
	classification: IntentClassification,
	error: string,
	sugerencia?: string,
): QueryResult {
	return {
		tipo: classification.kind,
		ruc: classification.extracted.ruc ?? "",
		periodo: classification.extracted.periodo ?? "",
		resultado: {},
		confianza: classification.confidence,
		fuentes: [],
		evidenceArtifacts: [],
		error,
		sugerencia,
	};
}
