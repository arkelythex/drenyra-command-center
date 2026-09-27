import { FeosError } from "./types";
export const DRENYRA_MODEL_REGISTRY = [
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
export class ModelRouter {
    registry = new Map();
    costTracker = [];
    constructor(entries) {
        const models = entries ?? DRENYRA_MODEL_REGISTRY;
        for (const model of models) {
            this.registry.set(model.id, model);
        }
    }
    getModel(id) {
        return this.registry.get(id);
    }
    listAvailable() {
        return Array.from(this.registry.values()).filter((m) => m.available);
    }
    route(input) {
        const available = this.listAvailable();
        const candidates = available.filter((m) => {
            const caps = m.capabilities;
            if (input.riskLevel === "R2" || input.riskLevel === "R3") {
                if (!caps.supportsConstrainedOutput || !caps.supportsJsonSchema)
                    return false;
            }
            if (input.riskLevel === "R3") {
                if (!caps.supportsToolCalling)
                    return false;
            }
            if (input.requiredCapabilities) {
                const hasTag = input.requiredCapabilities.every((cap) => m.tags.includes(cap));
                if (!hasTag)
                    return false;
            }
            return true;
        });
        if (candidates.length === 0) {
            throw new FeosError("NO_SUITABLE_MODEL", `No available model supports risk level "${input.riskLevel}" with the required capabilities`, { riskLevel: input.riskLevel, requiredCapabilities: input.requiredCapabilities });
        }
        const sorted = [...candidates].sort((a, b) => {
            const tierOrder = { flash: 0, reasoning: 1, opus: 2 };
            if (input.riskLevel === "R0" || input.riskLevel === "R1") {
                return tierOrder[a.tier] - tierOrder[b.tier];
            }
            if (input.riskLevel === "R2") {
                const aScore = tierOrder[a.tier] === 2 ? 99 : tierOrder[a.tier];
                const bScore = tierOrder[b.tier] === 2 ? 99 : tierOrder[b.tier];
                return aScore - bScore;
            }
            return tierOrder[a.tier] - tierOrder[b.tier];
        });
        const selected = sorted[0];
        const inputCost = selected.pricing.costPer1MInput;
        const outputCost = selected.pricing.costPer1MOutput;
        const estimatedCost = (inputCost + outputCost) / 100;
        return {
            selectedModel: selected.id,
            provider: selected.provider,
            tier: selected.tier,
            estimatedCost,
            reasoning: `Selected ${selected.id} (${selected.tier}) for R${riskLevelOrder(input.riskLevel)} — ${selected.capabilities.supportsConstrainedOutput ? "supports" : "no"} constrained output`,
            alternatives: sorted.slice(1, 3).map((m) => m.id),
        };
    }
    trackCost(entry) {
        const full = { ...entry, timestamp: new Date().toISOString() };
        this.costTracker.push(full);
        return full;
    }
    getWorkspaceCost(workspaceId) {
        return this.costTracker
            .filter((c) => c.workspaceId === workspaceId)
            .reduce((sum, c) => sum + c.cost, 0);
    }
    getTotalCost() {
        return this.costTracker.reduce((sum, c) => sum + c.cost, 0);
    }
}
function riskLevelOrder(level) {
    switch (level) {
        case "R0": return 0;
        case "R1": return 1;
        case "R2": return 2;
        case "R3": return 3;
    }
}
//# sourceMappingURL=model-routing.js.map