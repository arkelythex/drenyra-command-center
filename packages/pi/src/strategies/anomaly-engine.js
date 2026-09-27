import { compareSeverity, meetsThreshold } from "./types";
export class FiscalAnomalyEngine {
    strategies = new Map();
    eventBus;
    publishThreshold;
    trackPerformance;
    constructor(initialStrategies = [], eventBus, options) {
        this.eventBus = eventBus;
        this.publishThreshold = options?.publishThreshold ?? "medium";
        this.trackPerformance = options?.trackPerformance ?? false;
        for (const strategy of initialStrategies) {
            this.strategies.set(strategy.id, strategy);
        }
    }
    addStrategy(strategy) {
        this.strategies.set(strategy.id, strategy);
    }
    removeStrategy(id) {
        return this.strategies.delete(id);
    }
    getStrategy(id) {
        return this.strategies.get(id);
    }
    listStrategies() {
        return Array.from(this.strategies.values());
    }
    replaceStrategy(strategy) {
        this.strategies.set(strategy.id, strategy);
    }
    async runAll(data, context) {
        const results = [];
        for (const strategy of this.strategies.values()) {
            const result = await this.runSingle(strategy, data, context);
            results.push(result);
            if (this.eventBus && result.anomalies.length > 0) {
                await this.publishAnomalies(result);
            }
        }
        return results;
    }
    async runAllFlat(data, context) {
        const results = await this.runAll(data, context);
        const dedup = new Map();
        for (const result of results) {
            for (const anomaly of result.anomalies) {
                const key = `${anomaly.entityType}:${anomaly.entityId}:${anomaly.metric}`;
                const existing = dedup.get(key);
                if (!existing ||
                    compareSeverity(anomaly.severity, existing.severity) > 0) {
                    dedup.set(key, anomaly);
                }
            }
        }
        return Array.from(dedup.values());
    }
    async runStrategy(id, data, context) {
        const strategy = this.strategies.get(id);
        if (!strategy) {
            return {
                strategyId: id,
                strategyName: id,
                anomalies: [],
                durationMs: 0,
                error: `Strategy "${id}" not found`,
            };
        }
        const result = await this.runSingle(strategy, data, context);
        if (this.eventBus && result.anomalies.length > 0) {
            await this.publishAnomalies(result);
        }
        return result;
    }
    async runSingle(strategy, data, context) {
        const start = this.trackPerformance ? performance.now() : 0;
        try {
            const raw = await strategy.execute(data, context);
            const minSev = strategy.minSeverity;
            const anomalies = minSev
                ? raw.filter((a) => meetsThreshold(a, minSev))
                : raw;
            const durationMs = this.trackPerformance ? performance.now() - start : 0;
            return {
                strategyId: strategy.id,
                strategyName: strategy.name,
                anomalies,
                durationMs,
            };
        }
        catch (error) {
            const durationMs = this.trackPerformance ? performance.now() - start : 0;
            return {
                strategyId: strategy.id,
                strategyName: strategy.name,
                anomalies: [],
                durationMs,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    async publishAnomalies(result) {
        if (!this.eventBus)
            return;
        const publishable = result.anomalies.filter((a) => meetsThreshold(a, this.publishThreshold));
        const publishContext = {
            tenantId: "system",
            userId: "system",
            organizationId: "system",
            companyId: "system",
            ruc: "00000000000",
            traceId: `anomaly-batch-${Date.now()}`,
        };
        for (const anomaly of publishable) {
            await this.eventBus.publish("fiscal.anomaly.detected", {
                strategyId: result.strategyId,
                strategyName: result.strategyName,
                anomaly,
            }, publishContext, { source: `anomaly-engine:${result.strategyId}` });
        }
    }
}
//# sourceMappingURL=anomaly-engine.js.map