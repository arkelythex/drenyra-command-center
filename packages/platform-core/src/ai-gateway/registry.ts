/**
 * Model Registry — Domain-Agnostic Model Catalog.
 *
 * Manages a catalog of AI models with capability-based selection,
 * cost tracking, and rate limit configuration.
 *
 * Zero fiscal imports — capabilities are plain strings, not
 * domain-specific enums.
 *
 * @module @arkelythex/platform-core/ai-gateway
 */

// ──────────────────────────────────────────────
// Model Types
// ──────────────────────────────────────────────

/**
 * A model capability identifier (domain-agnostic string).
 * Examples: "chat", "streaming", "reasoning", "vision", "embedding"
 */
export type ModelCapability = string;

/**
 * Cost configuration for a model.
 */
export interface ModelCost {
  /** Cost per 1M input tokens in USD */
  costPer1MInput: number;
  /** Cost per 1M output tokens in USD */
  costPer1MOutput: number;
}

/**
 * Rate limit configuration for a model.
 */
export interface RateLimits {
  /** Maximum requests per minute */
  requestsPerMinute?: number;
  /** Maximum tokens per minute */
  tokensPerMinute?: number;
}

/**
 * A registered model in the catalog.
 */
export interface ModelRegistration {
  /** Unique model identifier */
  id: string;
  /** Human-readable model name */
  name: string;
  /** Provider that serves this model */
  provider: string;
  /** Model capabilities (domain-agnostic strings) */
  capabilities: ModelCapability[];
  /** Cost per token tier */
  cost: ModelCost;
  /** Rate limit constraints */
  rateLimits?: RateLimits;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Returns the total cost (input + output) for a model.
 */
function totalModelCost(model: ModelRegistration): number {
  return model.cost.costPer1MInput + model.cost.costPer1MOutput;
}

/**
 * Checks whether a model supports ALL required capabilities.
 */
function hasAllCapabilities(
  model: ModelRegistration,
  required: ModelCapability[],
): boolean {
  return required.every((cap) => model.capabilities.includes(cap));
}

// ──────────────────────────────────────────────
// Model Registry
// ──────────────────────────────────────────────

/**
 * A registry for cataloging and selecting AI models.
 *
 * @example
 * ```ts
 * const registry = new ModelRegistry();
 * registry.register({
 *   id: "gemini-3-flash",
 *   name: "Gemini 3 Flash",
 *   provider: "google",
 *   capabilities: ["chat", "streaming"],
 *   cost: { costPer1MInput: 0.1, costPer1MOutput: 0.4 },
 * });
 *
 * const cheapChatModels = registry.selectByCapability(["chat"]);
 * ```
 */
export class ModelRegistry {
  private models = new Map<string, ModelRegistration>();

  /**
   * Register a model. Overwrites if a model with the same id exists.
   */
  register(model: ModelRegistration): void {
    this.models.set(model.id, model);
  }

  /**
   * Get a registered model by id. Returns undefined if not found.
   */
  get(id: string): ModelRegistration | undefined {
    return this.models.get(id);
  }

  /**
   * List all registered models.
   */
  list(): ModelRegistration[] {
    return Array.from(this.models.values());
  }

  /**
   * Select models that have ALL required capabilities, sorted by cost ascending.
   * Returns empty array if no models match.
   */
  selectByCapability(capabilities: ModelCapability[]): ModelRegistration[] {
    return this.list()
      .filter((model) => (capabilities.length === 0 ? true : hasAllCapabilities(model, capabilities)))
      .sort((a, b) => totalModelCost(a) - totalModelCost(b));
  }

  /**
   * Remove a registered model. Returns true if removed, false if not found.
   */
  remove(id: string): boolean {
    return this.models.delete(id);
  }
}
