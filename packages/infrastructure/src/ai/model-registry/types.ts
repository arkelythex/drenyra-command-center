import type { LanguageModel } from "ai";

// ============================================
// PROVIDER TYPES
// ============================================

/**
 * AIProvider type.
 *
 * @example
 * ```ts
 * const value: AIProvider = {} as AIProvider;
 * console.log(value);
 * ```
 */
export type AIProvider = "google" | "anthropic" | "openai";

/**
 * ModelTier type.
 *
 * @example
 * ```ts
 * const value: ModelTier = {} as ModelTier;
 * console.log(value);
 * ```
 */
export type ModelTier = "flash" | "reasoning" | "opus";

/**
 * TaskType type.
 *
 * @example
 * ```ts
 * const value: TaskType = {} as TaskType;
 * console.log(value);
 * ```
 */
export type TaskType =
	| "ocr"
	| "extraction"
	| "classification"
	| "validation"
	| "correction"
	| "analysis"
	| "normative_reasoning"
	| "fraud_detection";

// ============================================
// MODEL DEFINITION TYPES
// ============================================

export interface ModelDefinition {
	id: string;
	provider: AIProvider;
	tier: ModelTier;
	costPer1MInput: number; // USD
	costPer1MOutput: number; // USD
	contextWindow: number;
	available: boolean;
}

export interface ModelSelectionConfig {
	preferredProvider: AIProvider;
	fallbackProvider: AIProvider;
	allowCrossProvider: boolean;
	maxCostPerRequest: number | null;
	preferSpeed: boolean;
}

export interface ModelSelection {
	model: LanguageModel;
	modelKey: string;
	definition: ModelDefinition;
	selectionReason: string;
}

// ============================================
// OPENROUTER TIERS (2026+ Future-Proof)
// ============================================

/**
 * OpenRouter model tiers for streaming + tool calling
 * Separated from Vercel AI SDK registry above
 *
 * Future-proof: When Claude Opus 4.6 (1M context) or Gemini 3 Pro drops,
 * update the array here and all endpoints automatically use it.
 *
 * @since Feb 2026
 * @example
 * ```ts
 * const value: OpenRouterModelTier = {} as OpenRouterModelTier;
 * console.log(value);
 * ```
 */

export interface OpenRouterModelTier {
  id: string;
  models: string[];  // Ordered preference, fallback chain
  maxTokens: number;
  temperature: number;
  costLimit: number;  // Max USD per request
}
