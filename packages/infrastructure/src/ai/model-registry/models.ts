import type { ModelDefinition, OpenRouterModelTier } from "./types";
import type { TaskType, ModelTier } from "./types";

// ============================================
// MODEL DEFINITIONS
// ============================================

/**
 * Available models with pricing (November 2025)
 * @example
 * ```ts
 * console.log(AVAILABLE_MODELS);
 * ```
 */

export const AVAILABLE_MODELS: Record<string, ModelDefinition> = {
	// Google Models
	"gemini-3-flash": {
		id: "gemini-3-flash",
		provider: "google",
		tier: "flash",
		costPer1MInput: 0.1,
		costPer1MOutput: 0.4,
		contextWindow: 1_000_000,
		available: true,
	},
	"gemini-3-pro": {
		id: "gemini-3-pro",
		provider: "google",
		tier: "reasoning",
		costPer1MInput: 2.0,
		costPer1MOutput: 12.0,
		contextWindow: 2_000_000,
		available: true,
	},

	// Anthropic Models
	"claude-haiku-4.5": {
		id: "claude-3-5-haiku-latest",
		provider: "anthropic",
		tier: "flash",
		costPer1MInput: 1.0,
		costPer1MOutput: 5.0,
		contextWindow: 200_000,
		available: true,
	},
	"claude-sonnet-4.5": {
		id: "claude-sonnet-4-20250514",
		provider: "anthropic",
		tier: "reasoning",
		costPer1MInput: 3.0,
		costPer1MOutput: 15.0,
		contextWindow: 200_000,
		available: true,
	},
	"claude-opus-4.5": {
		id: "claude-opus-4-20250514",
		provider: "anthropic",
		tier: "opus",
		costPer1MInput: 5.0,
		costPer1MOutput: 25.0,
		contextWindow: 200_000,
		available: true,
	},

	// OpenAI Models (requires @ai-sdk/openai installation)
	// Uncomment when SDK is installed:
	// 'gpt-5-nano': { ... },
} as const;

// ============================================
// TASK TO TIER MAPPING
// ============================================

/**
 * Maps task types to the minimum required tier
 * @example
 * ```ts
 * console.log(TASK_TIER_REQUIREMENTS);
 * ```
 */

export const TASK_TIER_REQUIREMENTS: Record<TaskType, ModelTier> = {
	ocr: "flash",
	extraction: "flash",
	classification: "flash",
	validation: "reasoning",
	correction: "reasoning",
	analysis: "opus",
	normative_reasoning: "opus",
	fraud_detection: "opus",
};

// ============================================
// OPENROUTER TIERS (2026+ Future-Proof)
// ============================================

/**
 * Model tiers optimized for different capabilities via OpenRouter
 * @example
 * ```ts
 * console.log(OPENROUTER_MODEL_TIERS);
 * ```
 */

export const OPENROUTER_MODEL_TIERS: Record<string, OpenRouterModelTier> = {
  /**
   * Reasoning - Complex problem solving, multi-step logic
   * Use cases: SUNAT compliance, tax optimization, complex refactoring
   */
  'reasoning': {
    id: 'reasoning',
    models: [
      'anthropic/claude-opus-4.6',      // 2026: 1M context, extended thinking
      'google/gemini-3-pro',            // 2026: Multimodal reasoning
      'anthropic/claude-opus-4',        // Fallback (current best)
    ],
    maxTokens: 8192,
    temperature: 0.3,
    costLimit: 0.50,
  },

  /**
   * Fast - Quick responses, high throughput
   * Use cases: Chat, validation, simple queries
   */
  'fast': {
    id: 'fast',
    models: [
      'anthropic/claude-sonnet-4.5',    // Current production (Feb 2026)
      'google/gemini-3-flash',          // 2026: Ultra-fast, cheap
      'deepseek/deepseek-v3',           // 2026: Open-source alternative
    ],
    maxTokens: 4096,
    temperature: 0.4,
    costLimit: 0.10,
  },

  /**
   * Code - Code generation, refactoring, reviews
   * Use cases: Bug fixing, feature implementation, documentation
   */
  'code': {
    id: 'code',
    models: [
      'deepseek/deepseek-coder-v3',     // 2026: Best code model (open-source)
      'anthropic/claude-opus-4.6',      // Fallback for complex refactors
      'anthropic/claude-sonnet-4.5',    // Budget fallback
    ],
    maxTokens: 16384,
    temperature: 0.1,
    costLimit: 0.30,
  },

  /**
   * Vision - OCR, image analysis, document processing
   * Use cases: Invoice OCR, document validation, diagrams
   */
  'vision': {
    id: 'vision',
    models: [
      'google/gemini-3-pro',            // 2026: Native multimodal
      'anthropic/claude-sonnet-4.5',    // Vision support
      'openai/gpt-4o',                  // Fallback
    ],
    maxTokens: 4096,
    temperature: 0.2,
    costLimit: 0.25,
  },
};
