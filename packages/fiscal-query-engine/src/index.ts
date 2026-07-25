/**
 * Fiscal Query Engine — Public API
 */

// AI Classifier
export { classifyWithAI } from "./ai-classifier";
export type { ClassifierOptions } from "./classifier";

// Classifier
export { classifyQuery } from "./classifier";
// Evidence Formatter
export { formatAsJson, formatAsText } from "./evidence-formatter";
// Intent Registry
export {
	buildClarification,
	extractKeywords,
	extractPeriodo,
	extractRuc,
	INTENT_PATTERNS,
	matchIntentPatterns,
} from "./intent-registry";
export type { PipelineRoute } from "./pipeline-router";
// Pipeline Router
export { routeIntent } from "./pipeline-router";
// Response Builder
export { buildErrorResponse, buildQueryResult } from "./response-builder";
// Types
export type {
	EvidenceRef,
	EvidenceSource,
	IntentClassification,
	IntentKind,
	IntentPattern,
	QueryInput,
	QueryResult,
} from "./types";
