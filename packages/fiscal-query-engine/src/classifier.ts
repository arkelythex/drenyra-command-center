/**
 * Fiscal Query Engine — Intent Classifier
 *
 * Two-tier classification:
 * 1. Pattern matching (fast, deterministic, deterministic)
 * 2. AI fallback via orchestrator's ModelRouter (when confidence < 0.4)
 */

import { classifyWithAI } from "./ai-classifier";
import { buildClarification, matchIntentPatterns } from "./intent-registry";
import type { IntentClassification, QueryInput } from "./types";

export interface ClassifierOptions {
	patternThreshold?: number;
	aiFallbackThreshold?: number;
}

const DEFAULT_OPTIONS: Required<ClassifierOptions> = {
	patternThreshold: 0.7,
	aiFallbackThreshold: 0.4,
};

/**
 * Three-tier classification:
 * 1. Pattern matching (fast, deterministic)
 * 2. Medium confidence → clarification suggestions
 * 3. Low confidence → AI fallback via LLM Gateway (DeepSeek/OpenAI)
 */
export async function classifyQuery(
	input: QueryInput,
	options?: ClassifierOptions,
): Promise<IntentClassification & { suggestions?: string[] }> {
	const opts = { ...DEFAULT_OPTIONS, ...options };
	const match = matchIntentPatterns(input.texto);

	// Tier 1: High confidence — return pattern match
	if (match.confidence >= opts.patternThreshold) {
		return match;
	}

	// Tier 2: Between thresholds — try AI fallback first
	if (match.confidence >= opts.aiFallbackThreshold) {
		const aiResult = await classifyWithAI(input.texto);
		if (aiResult && aiResult.confidence >= opts.patternThreshold) {
			return aiResult;
		}
		// AI didn't help — return pattern match with suggestions
		const suggestions = buildClarification(match.extracted);
		return {
			...match,
			suggestions:
				suggestions.length > 0
					? suggestions
					: [
							"Probá ser más específico. Incluí RUC, período, y tipo de consulta.",
						],
		};
	}

	// Tier 3: Very low confidence — try AI fallback, then clarify
	const aiResult = await classifyWithAI(input.texto);
	if (aiResult && aiResult.confidence >= opts.aiFallbackThreshold) {
		return {
			...aiResult,
			suggestions: buildClarification(aiResult.extracted),
		};
	}

	// Both failed — clarify
	const suggestions = buildClarification(match.extracted);
	return {
		...match,
		confidence: match.confidence,
		suggestions,
	};
}
