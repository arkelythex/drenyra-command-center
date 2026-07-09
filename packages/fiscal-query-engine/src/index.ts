/**
 * Fiscal Query Engine — Public API
 */

// Types
export type {
	IntentKind,
	QueryInput,
	IntentClassification,
	QueryResult,
	EvidenceSource,
	EvidenceRef,
	IntentPattern,
} from "./types";

// Intent Registry
export {
	INTENT_PATTERNS,
	extractRuc,
	extractPeriodo,
	extractKeywords,
	matchIntentPatterns,
	buildClarification,
} from "./intent-registry";

// Classifier
export { classifyQuery } from "./classifier";
export type { ClassifierOptions } from "./classifier";

// AI Classifier
export { classifyWithAI } from "./ai-classifier";

// Pipeline Router
export { routeIntent } from "./pipeline-router";
export type { PipelineRoute } from "./pipeline-router";

// Evidence Formatter
export { formatAsText, formatAsJson } from "./evidence-formatter";

// Response Builder
export { buildQueryResult, buildErrorResponse } from "./response-builder";
