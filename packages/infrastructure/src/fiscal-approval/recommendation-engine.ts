/**
 * Fiscal Approval — Recommendation Engine
 *
 * Generates recommendations from pipeline outputs.
 * Each recommendation represents a proposed fiscal action
 * backed by evidence and a confidence score.
 */

import type {
	AccionFiscal,
	Recommendation,
	RecommendationSource,
} from "./types";

let _nextId = 1;

/** Generate a unique recommendation ID (REC-001, REC-002, ...). */
export function generateRecId(): string {
	const id = _nextId++;
	return `REC-${String(id).padStart(3, "0")}`;
}

/** Reset the ID counter (for tests). */
export function resetRecIdCounter(): void {
	_nextId = 1;
}

/** Input for generating a recommendation from pipeline output. */
export interface RecommendationInput {
	pipelineRunId: string;
	tipoAccion: AccionFiscal;
	ruc: string;
	periodo: string;
	descripcion: string;
	monto: number;
	moneda?: string;
	confianza: number;
	fuentes: RecommendationSource[];
}

/**
 * Generate a recommendation from pipeline output.
 */
export function generateRecommendation(
	input: RecommendationInput,
): Recommendation {
	const now = new Date().toISOString();

	return {
		id: generateRecId(),
		pipelineRunId: input.pipelineRunId,
		tipoAccion: input.tipoAccion,
		ruc: input.ruc,
		periodo: input.periodo,
		descripcion: input.descripcion,
		monto: input.monto,
		moneda: input.moneda ?? "PEN",
		confianza: input.confianza,
		fuentes: input.fuentes,
		status: "pending",
		creado: now,
	};
}

/**
 * Determine if a recommendation requires human approval based on confidence.
 * Returns true if the confidence is below the threshold.
 */
export function requiresApproval(
	recommendation: Recommendation,
	minConfidence: number,
): boolean {
	return recommendation.confianza < minConfidence;
}
