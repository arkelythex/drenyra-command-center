import { AVAILABLE_MODELS } from "../ai/model-registry";
import { loggers } from "../logger";
const UNKNOWN_MODEL_CONTEXT_WINDOW = 200_000;
const DEFAULT_CONFIG = {
    enabled: true,
    threshold: 0.95,
};
export class ContextMonitor {
    runs = new Map();
    config;
    sessionStore;
    constructor(sessionStore, config) {
        this.sessionStore = sessionStore;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    trackRequest(runId, modelId, usage) {
        try {
            const contextWindow = this.resolveContextWindow(modelId);
            const totalTokens = usage.promptTokens + usage.completionTokens;
            const existing = this.runs.get(runId);
            if (existing) {
                existing.totalTokens += totalTokens;
                existing.promptTokens += usage.promptTokens;
                existing.completionTokens += usage.completionTokens;
                existing.modelId = modelId;
                existing.contextWindow = contextWindow;
            }
            else {
                this.runs.set(runId, {
                    runId,
                    modelId,
                    contextWindow,
                    totalTokens,
                    promptTokens: usage.promptTokens,
                    completionTokens: usage.completionTokens,
                    thresholdReached: false,
                });
            }
            this.persistUsageSnapshot(runId, modelId, contextWindow).catch((err) => {
                loggers.ai.error("ContextMonitor: failed to persist usage snapshot", {
                    runId,
                    error: String(err),
                });
            });
        }
        catch (err) {
            loggers.ai.error("ContextMonitor: trackRequest failed", {
                runId,
                error: String(err),
            });
        }
    }
    shouldPrune(runId) {
        try {
            const run = this.runs.get(runId);
            if (!run)
                return false;
            if (run.contextWindow <= 0)
                return false;
            const usageRatio = run.totalTokens / run.contextWindow;
            if (usageRatio >= this.config.threshold && !run.thresholdReached) {
                run.thresholdReached = true;
                this.persistThresholdEvent(runId, run, usageRatio).catch((err) => {
                    loggers.ai.error("ContextMonitor: failed to persist threshold event", { runId, error: String(err) });
                });
                return true;
            }
            return run.thresholdReached;
        }
        catch (err) {
            loggers.ai.error("ContextMonitor: shouldPrune failed", {
                runId,
                error: String(err),
            });
            return false;
        }
    }
    getRunUsage(runId) {
        try {
            const run = this.runs.get(runId);
            if (!run)
                return null;
            return {
                totalTokens: run.totalTokens,
                promptTokens: run.promptTokens,
                completionTokens: run.completionTokens,
                modelContextWindow: run.contextWindow,
                modelId: run.modelId,
                usageRatio: run.contextWindow > 0 ? run.totalTokens / run.contextWindow : 0,
                lastChecked: new Date(),
            };
        }
        catch (err) {
            loggers.ai.error("ContextMonitor: getRunUsage failed", {
                runId,
                error: String(err),
            });
            return null;
        }
    }
    resetRun(runId) {
        try {
            this.runs.delete(runId);
        }
        catch (err) {
            loggers.ai.error("ContextMonitor: resetRun failed", {
                runId,
                error: String(err),
            });
        }
    }
    resolveContextWindow(modelId) {
        const modelDef = AVAILABLE_MODELS[modelId];
        if (modelDef?.contextWindow) {
            return modelDef.contextWindow;
        }
        loggers.ai.warn("ContextMonitor: unknown model, using fallback context window", {
            modelId,
            fallbackWindow: UNKNOWN_MODEL_CONTEXT_WINDOW,
        });
        return UNKNOWN_MODEL_CONTEXT_WINDOW;
    }
    async persistUsageSnapshot(runId, modelId, _contextWindow) {
        if (!this.sessionStore)
            return;
        const run = this.runs.get(runId);
        if (!run)
            return;
        await this.sessionStore.appendEvent(runId, {
            runId,
            eventType: "context_usage_snapshot",
            payload: {
                cumulativeTokens: run.totalTokens,
                contextWindow: run.contextWindow,
                usageRatio: run.contextWindow > 0 ? run.totalTokens / run.contextWindow : 0,
                model: modelId,
                promptTokens: run.promptTokens,
                completionTokens: run.completionTokens,
            },
            companyId: "00000000-0000-0000-0000-000000000000",
        });
    }
    async persistThresholdEvent(runId, run, usageRatio) {
        if (!this.sessionStore)
            return;
        await this.sessionStore.appendEvent(runId, {
            runId,
            eventType: "context_threshold_reached",
            payload: {
                usageRatio,
                cumulativeTokens: run.totalTokens,
                contextWindow: run.contextWindow,
                model: run.modelId,
            },
            companyId: "00000000-0000-0000-0000-000000000000",
        });
    }
}
//# sourceMappingURL=context-monitor.js.map