import { AVAILABLE_MODELS } from "../ai/model-registry";
import { loggers } from "../logger";
const UNKNOWN_MODEL_CONTEXT_WINDOW = 200_000;
const DEFAULT_PRUNER_CONFIG = {
    strategy: "sliding-window",
    maxMessages: 6,
    tokenBudgetRatio: 0.95,
    enableSummarization: false,
};
export class ContextPruner {
    config;
    onPruneApplied;
    summarizeFn;
    constructor(config, options) {
        this.config = { ...DEFAULT_PRUNER_CONFIG, ...config };
        this.onPruneApplied = options?.onPruneApplied;
        this.summarizeFn = options?.summarizeFn;
    }
    prune(messages, runId) {
        try {
            if (this.config.strategy === "disabled") {
                return this.noOpResult(messages, "disabled");
            }
            if (messages.length <= this.config.maxMessages) {
                return this.noOpResult(messages, this.config.strategy);
            }
            let pruned;
            const strategyUsed = this.executeStrategy(messages);
            pruned = strategyUsed.messages;
            const tokensBefore = this.getEstimatedTokenCount(messages);
            const tokensAfter = this.getEstimatedTokenCount(pruned);
            const result = {
                messages: pruned,
                strategy: strategyUsed.strategy,
                tokensBefore,
                tokensAfter,
            };
            if (tokensAfter < tokensBefore && this.onPruneApplied) {
                try {
                    this.onPruneApplied(result, runId);
                }
                catch {
                }
            }
            return result;
        }
        catch (err) {
            loggers.ai.warn("ContextPruner: prune failed, returning original messages", {
                error: String(err),
            });
            return this.noOpResult(messages, this.config.strategy);
        }
    }
    executeStrategy(messages) {
        if (this.config.strategy === "summarization" &&
            this.config.enableSummarization) {
            try {
                const summarized = this.summarize(messages);
                return { messages: summarized, strategy: "summarization" };
            }
            catch (err) {
                loggers.ai.warn("ContextPruner: summarization failed, falling back to sliding-window", { error: String(err) });
            }
        }
        const sliced = this.slidingWindow(messages, this.config.maxMessages);
        return { messages: sliced, strategy: "sliding-window" };
    }
    slidingWindow(messages, maxMessages) {
        const systemMessages = messages.filter((m) => m.role === "system");
        const nonSystemMessages = messages.filter((m) => m.role !== "system");
        const keptNonSystem = nonSystemMessages.slice(-maxMessages);
        return [...systemMessages, ...keptNonSystem];
    }
    summarize(messages) {
        const maxMessages = this.config.maxMessages;
        if (messages.length <= maxMessages) {
            return messages;
        }
        if (!this.summarizeFn) {
            throw new Error("Summarization not configured — no summarizeFn provided");
        }
        const _systemMessages = messages.filter((m) => m.role === "system");
        const nonSystemMessages = messages.filter((m) => m.role !== "system");
        const keepCount = Math.max(1, Math.floor(maxMessages / 2));
        const _keptNonSystem = nonSystemMessages.slice(-keepCount);
        const toSummarize = nonSystemMessages.slice(0, -keepCount);
        if (toSummarize.length === 0) {
            return this.slidingWindow(messages, maxMessages);
        }
        const _contextStr = toSummarize
            .map((m) => `[${m.role}]: ${m.content}`)
            .join("\n");
        const _summaryPromise = this.summarizeFn(toSummarize);
        throw new Error("Synchronous summarization not supported — use async path for LLM-based pruning");
    }
    async summarizeAsync(messages) {
        try {
            const maxMessages = this.config.maxMessages;
            if (messages.length <= maxMessages) {
                return messages;
            }
            if (!this.summarizeFn) {
                return this.slidingWindow(messages, maxMessages);
            }
            const systemMessages = messages.filter((m) => m.role === "system");
            const nonSystemMessages = messages.filter((m) => m.role !== "system");
            const keepCount = Math.max(1, Math.floor(maxMessages / 2));
            const keptNonSystem = nonSystemMessages.slice(-keepCount);
            const toSummarize = nonSystemMessages.slice(0, -keepCount);
            if (toSummarize.length === 0) {
                return this.slidingWindow(messages, maxMessages);
            }
            const summary = await this.summarizeFn(toSummarize);
            if (!summary || summary.trim().length === 0) {
                loggers.ai.warn("ContextPruner: summarization returned empty response, using sliding-window");
                return this.slidingWindow(messages, maxMessages);
            }
            return [
                ...systemMessages,
                { role: "system", content: `[Previous context summary]: ${summary}` },
                ...keptNonSystem,
            ];
        }
        catch (err) {
            loggers.ai.warn("ContextPruner: async summarization failed, using sliding-window fallback", { error: String(err) });
            return this.slidingWindow(messages, this.config.maxMessages);
        }
    }
    calculateBudget(modelId, ratio) {
        const effectiveRatio = ratio ?? this.config.tokenBudgetRatio;
        const modelDef = AVAILABLE_MODELS[modelId];
        const contextWindow = modelDef?.contextWindow ?? UNKNOWN_MODEL_CONTEXT_WINDOW;
        return {
            maxTokens: Math.floor(contextWindow * effectiveRatio),
            contextWindow,
            ratio: effectiveRatio,
        };
    }
    getEstimatedTokenCount(messages) {
        if (messages.length === 0)
            return 0;
        const charCount = messages.reduce((sum, m) => sum + m.content.length, 0);
        return Math.max(Math.ceil(charCount / 4), messages.length * 100);
    }
    getCheapestFlashModel() {
        let cheapest = "gemini-3-flash";
        let lowestCost = Infinity;
        for (const [key, def] of Object.entries(AVAILABLE_MODELS)) {
            if (def.tier === "flash" && def.available) {
                const totalCost = def.costPer1MInput + def.costPer1MOutput;
                if (totalCost < lowestCost) {
                    lowestCost = totalCost;
                    cheapest = key;
                }
            }
        }
        return cheapest;
    }
    noOpResult(messages, strategy) {
        const tokens = this.getEstimatedTokenCount(messages);
        return {
            messages,
            strategy,
            tokensBefore: tokens,
            tokensAfter: tokens,
        };
    }
}
export function createContextPruner(config, options) {
    return new ContextPruner(config, options);
}
//# sourceMappingURL=context-pruner.js.map