/**
 * AI Models Configuration - Adaptive Compute Router
 *
 * Strategy: Use the right model for the right task to optimize cost and performance
 * - Flash: Fast & cheap (OCR, extraction) (Gemini 3 Flash - Dec 2025)
 * - Pro: Reasoning (validation, logic) (Gemini 3 Pro)
 *
 * @updated December 2025 - Upgraded to Gemini 3 series
 */

import { google } from "@ai-sdk/google";

/**
 * Gemini 3 Flash - Fast & Cheap (78% SWE-bench Verified)
 * Use for: OCR, data extraction, quick tasks, agentic workflows
 * Cost: Very Low | Launched: Dec 17, 2025
 * @example
 * ```ts
 * console.log(modelFlash);
 * ```
 */

export const modelFlash = google("gemini-3-flash");

/**
 * Gemini 3 Pro - Reasoning Engine
 * Use for: Complex validation, business logic, error correction
 * Cost: Moderate
 * @example
 * ```ts
 * console.log(modelReasoning);
 * ```
 */

export const modelReasoning = google("gemini-3-pro");

/**
 * Gemini 3 Pro - Heavy Analysis (Alias for consistency)
 * Use for: Very complex tasks, multi-document analysis
 * @example
 * ```ts
 * console.log(modelOpus);
 * ```
 */

export const modelOpus = google("gemini-3-pro");

/**
 * Model Selection Strategy
 * @example
 * ```ts
 * console.log(MODEL_STRATEGY);
 * ```
 */

export const MODEL_STRATEGY = {
	OCR: "flash", // PDF/Image to text
	EXTRACTION: "flash", // Pull structured data
	VALIDATION: "reasoning", // Check business rules
	CORRECTION: "reasoning", // Fix errors
	ANALYSIS: "opus", // Deep analysis (rare)
} as const;

/**
 * ModelTask type.
 *
 * @example
 * ```ts
 * const value: ModelTask = {} as ModelTask;
 * console.log(value);
 * ```
 */
export type ModelTask = keyof typeof MODEL_STRATEGY;

/**
 * Get the appropriate model for a task
 * @param task - Input for task.
 * @returns Result of getModelForTask.
 * @example
 * ```ts
 * const result = getModelForTask({} as ModelTask);
 * console.log(result);
 * ```
 */

export function getModelForTask(task: ModelTask) {
	const strategy = MODEL_STRATEGY[task];

	switch (strategy) {
		case "flash":
			return modelFlash;
		case "reasoning":
			return modelReasoning;
		case "opus":
			return modelOpus;
		default:
			return modelFlash;
	}
}
