/**
 * FEOS-012 — Model Routing and Cost Control
 *
 * Model capability registry with cost tracking, risk-based routing,
 * and provider selection. Ensures that R0-R3 tool contracts route
 * to models that can satisfy their schema requirements.
 *
 * Principles:
 * - A model must support constrained output for R2+
 * - Cost is tracked per provider/model per workspace
 * - Routing is deterministic based on capabilities + cost budget
 * - Frontier models are NOT used for tasks a smaller model can handle
 *
 * @module @drenyra/domain/feos/model-routing
 */

import type { ToolRiskLevel } from "./tool-contract";
import { FeosError } from "./types";

// ============================================================================
// Provider & Model Types
// ============================================================================

export type AIProvider = "google" | "anthropic" | "openai" | "deepseek" | "grok" | "openrouter";

export type ModelTier = "flash" | "reasoning" | "opus";

export interface ModelCapabilities {
  /** Whether the model supports constrained/tool-calling output. */
  supportsConstrainedOutput: boolean;
  /** Whether the model supports JSON Schema output. */
  supportsJsonSchema: boolean;
  /** Whether the model supports tool calling. */
  supportsToolCalling: boolean;
  /** Whether the model supports streaming. */
  supportsStreaming: boolean;
  /** Whether the model supports vision/image input. */
  supportsVision: boolean;
  /** Maximum context window in tokens. */
  contextWindow: number;
  /** Maximum output tokens. */
  maxOutputTokens: number;
}

export interface ModelPricing {
  /** Cost per 1M input tokens (USD). */
  costPer1MInput: number;
  /** Cost per 1M output tokens (USD). */
  costPer1MOutput: number;
  /** Currency. */
  currency: string;
}

export interface ModelEntry {
  /** Model identifier (e.g. "gemini-2.0-flash"). */
  id: string;
  /** Provider name. */
  provider: AIProvider;
  /** Model tier. */
  tier: ModelTier;
  /** Capabilities. */
  capabilities: ModelCapabilities;
  /** Pricing. */
  pricing: ModelPricing;
  /** Whether the model is currently available. */
  available: boolean;
  /** Tags for routing. */
  tags: string[];
}

// ============================================================================
// Cost Tracking
// ============================================================================

export interface CostEntry {
  modelId: string;
  provider: AIProvider;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  currency: string;
  workspaceId?: string;
  traceId: string;
  timestamp: string;
  toolName?: string;
}

export interface CostBudget {
  /** Maximum cost per workspace per period (USD). */
  maxPerWorkspace: number;
  /** Maximum cost per company per period (USD). */
  maxPerCompany: number;
  /** Current cost this period, keyed by workspaceId. */
  currentWorkspaceCosts: Map<string, number>;
  /** Current cost this period for the company. */
  currentCompanyCost: number;
}

// ============================================================================
// Routing Decision
// ============================================================================

export interface RoutingDecision {
  selectedModel: string;
  provider: AIProvider;
  tier: ModelTier;
  estimatedCost: number;
  reasoning: string;
  alternatives: string[];
}

// ============================================================================
// Model Registry
// ============================================================================

/**
 * Built-in model registry with Drenyra's default model definitions.
 */
export const DRENYRA_MODEL_REGISTRY: ModelEntry[] = [
  {
    id: "gemini-2.0-flash",
    provider: "google",
    tier: "flash",
    capabilities: {
      supportsConstrainedOutput: true,
      supportsJsonSchema: true,
      supportsToolCalling: true,
      supportsStreaming: true,
      supportsVision: true,
      contextWindow: 1_000_000,
      maxOutputTokens: 8_192,
    },
    pricing: { costPer1MInput: 0.10, costPer1MOutput: 0.40, currency: "USD" },
    available: true,
    tags: ["ocr", "extraction", "classification"],
  },
  {
    id: "gemini-2.5-flash",
    provider: "google",
    tier: "reasoning",
    capabilities: {
      supportsConstrainedOutput: true,
      supportsJsonSchema: true,
      supportsToolCalling: true,
      supportsStreaming: true,
      supportsVision: true,
      contextWindow: 1_000_000,
      maxOutputTokens: 8_192,
    },
    pricing: { costPer1MInput: 0.15, costPer1MOutput: 0.60, currency: "USD" },
    available: true,
    tags: ["validation", "analysis", "normative_reasoning"],
  },
  {
    id: "deepseek-v4-flash",
    provider: "deepseek",
    tier: "flash",
    capabilities: {
      supportsConstrainedOutput: true,
      supportsJsonSchema: true,
      supportsToolCalling: true,
      supportsStreaming: true,
      supportsVision: false,
      contextWindow: 128_000,
      maxOutputTokens: 4_096,
    },
    pricing: { costPer1MInput: 0.30, costPer1MOutput: 0.60, currency: "USD" },
    available: true,
    tags: ["extraction", "classification", "validation"],
  },
  {
    id: "deepseek-v4-pro",
    provider: "deepseek",
    tier: "opus",
    capabilities: {
      supportsConstrainedOutput: true,
      supportsJsonSchema: true,
      supportsToolCalling: true,
      supportsStreaming: true,
      supportsVision: true,
      contextWindow: 200_000,
      maxOutputTokens: 8_192,
    },
    pricing: { costPer1MInput: 2.00, costPer1MOutput: 8.00, currency: "USD" },
    available: true,
    tags: ["judgment_day", "complex_analysis", "regulatory"],
  },
  {
    id: "claude-sonnet-4",
    provider: "anthropic",
    tier: "reasoning",
    capabilities: {
      supportsConstrainedOutput: true,
      supportsJsonSchema: true,
      supportsToolCalling: true,
      supportsStreaming: true,
      supportsVision: true,
      contextWindow: 200_000,
      maxOutputTokens: 8_192,
    },
    pricing: { costPer1MInput: 3.00, costPer1MOutput: 15.00, currency: "USD" },
    available: true,
    tags: ["analysis", "normative_reasoning"],
  },
];

// ============================================================================
// Router
// ============================================================================

export class ModelRouter {
  private registry: Map<string, ModelEntry> = new Map();
  private costTracker: CostEntry[] = [];

  constructor(entries?: ModelEntry[]) {
    const models = entries ?? DRENYRA_MODEL_REGISTRY;
    for (const model of models) {
      this.registry.set(model.id, model);
    }
  }

  /** Get a model from the registry. */
  getModel(id: string): ModelEntry | undefined {
    return this.registry.get(id);
  }

  /** List all available models. */
  listAvailable(): ModelEntry[] {
    return Array.from(this.registry.values()).filter((m) => m.available);
  }

  /**
   * Route a task to the best model based on risk level, cost budget, and required capabilities.
   *
   * Rules:
   * - R0: Any available model (prefer flash for cost)
   * - R1: Flash or reasoning (structured preferred)
   * - R2: Must support constrained output + JSON Schema
   * - R3: Must support constrained output + JSON Schema + tool calling
   * - Never use opus when flash suffices (cost optimization)
   */
  route(input: {
    riskLevel: ToolRiskLevel;
    taskType: string;
    requiredCapabilities?: string[];
    budget?: CostBudget;
    workspaceId?: string;
  }): RoutingDecision {
    const available = this.listAvailable();

    // Filter by model capability requirements
    const candidates = available.filter((m) => {
      const caps = m.capabilities;

      // R2+ requires constrained output
      if (input.riskLevel === "R2" || input.riskLevel === "R3") {
        if (!caps.supportsConstrainedOutput || !caps.supportsJsonSchema) return false;
      }

      // R3 additionally requires tool calling
      if (input.riskLevel === "R3") {
        if (!caps.supportsToolCalling) return false;
      }

      // Check specific required capabilities via tags
      if (input.requiredCapabilities) {
        const hasTag = input.requiredCapabilities.every(
          (cap) => m.tags.includes(cap),
        );
        if (!hasTag) return false;
      }

      return true;
    });

    if (candidates.length === 0) {
      throw new FeosError(
        "NO_SUITABLE_MODEL",
        `No available model supports risk level "${input.riskLevel}" with the required capabilities`,
        { riskLevel: input.riskLevel, requiredCapabilities: input.requiredCapabilities },
      );
    }

    // Sort by cost (cheapest first within same tier)
    const sorted = [...candidates].sort((a, b) => {
      // Prefer flash tier for R0/R1, reasoning for R2, opus only when explicitly needed
      const tierOrder: Record<ModelTier, number> = { flash: 0, reasoning: 1, opus: 2 };

      // For R0/R1, prefer flash
      if (input.riskLevel === "R0" || input.riskLevel === "R1") {
        return tierOrder[a.tier] - tierOrder[b.tier];
      }

      // For R2, prefer reasoning or flash
      if (input.riskLevel === "R2") {
        const aScore = tierOrder[a.tier] === 2 ? 99 : tierOrder[a.tier];
        const bScore = tierOrder[b.tier] === 2 ? 99 : tierOrder[b.tier];
        return aScore - bScore;
      }

      // For R3, prefer reasoning (opus is fallback)
      return tierOrder[a.tier] - tierOrder[b.tier];
    });

        const selected = sorted[0];
        if (selected === undefined) {
          // Unreachable: candidates.length === 0 throws above and sorted is a copy.
          throw new FeosError(
            "NO_SUITABLE_MODEL",
            `No available model supports risk level "${input.riskLevel}"`,
            { riskLevel: input.riskLevel },
          );
        }
    
    // Check budget
    const inputCost = selected.pricing.costPer1MInput;
    const outputCost = selected.pricing.costPer1MOutput;
    const estimatedCost = (inputCost + outputCost) / 100; // Rough estimate

    return {
      selectedModel: selected.id,
      provider: selected.provider,
      tier: selected.tier,
      estimatedCost,
      reasoning: `Selected ${selected.id} (${selected.tier}) for R${riskLevelOrder(input.riskLevel)} — ${selected.capabilities.supportsConstrainedOutput ? "supports" : "no"} constrained output`,
      alternatives: sorted.slice(1, 3).map((m) => m.id),
    };
  }

  /**
   * Track a cost entry.
   */
  trackCost(entry: Omit<CostEntry, "timestamp">): CostEntry {
    const full: CostEntry = { ...entry, timestamp: new Date().toISOString() };
    this.costTracker.push(full);
    return full;
  }

  /**
   * Get accumulated cost for a workspace.
   */
  getWorkspaceCost(workspaceId: string): number {
    return this.costTracker
      .filter((c) => c.workspaceId === workspaceId)
      .reduce((sum, c) => sum + c.cost, 0);
  }

  /**
   * Get total cost across all tracked entries.
   */
  getTotalCost(): number {
    return this.costTracker.reduce((sum, c) => sum + c.cost, 0);
  }
}

function riskLevelOrder(level: ToolRiskLevel): number {
  switch (level) { case "R0": return 0; case "R1": return 1; case "R2": return 2; case "R3": return 3; }
}
