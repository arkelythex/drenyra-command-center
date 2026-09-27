import { generateId, nowTimestamp } from "./types";
export function emptyCostMetrics(period) {
    return [
        { metric: "cost_per_document", value: 0, unit: "USD", period },
        { metric: "cost_per_reconciliation", value: 0, unit: "USD", period },
        { metric: "cost_per_closed_company", value: 0, unit: "USD", period },
        { metric: "tokens_per_workflow", value: 0, unit: "tokens", period },
        { metric: "human_minutes_per_exception", value: 0, unit: "minutes", period },
        { metric: "infra_cost_per_tenant", value: 0, unit: "USD", period },
    ];
}
export class TelemetryStore {
    events = [];
    metrics = new Map();
    record(event) {
        const e = { ...event, id: generateId(), timestamp: nowTimestamp() };
        this.events.push(e);
        return e;
    }
    recordCost(metric) {
        const key = `${metric.period}:${metric.metric}`;
        const existing = this.metrics.get(key) ?? [];
        existing.push(metric);
        this.metrics.set(key, existing);
    }
    getEvents(category, limit = 100) {
        let result = this.events;
        if (category)
            result = result.filter((e) => e.category === category);
        return result.slice(-limit);
    }
    getCostMetrics(period) {
        const result = [];
        for (const [key, metrics] of this.metrics) {
            if (key.startsWith(period))
                result.push(...metrics);
        }
        return result;
    }
    aggregateCost(period) {
        const base = emptyCostMetrics(period);
        const actual = this.getCostMetrics(period);
        for (const m of base) {
            const matching = actual.filter((a) => a.metric === m.metric);
            if (matching.length > 0) {
                m.value = matching.reduce((sum, a) => sum + a.value, 0) / matching.length;
            }
        }
        return base;
    }
}
//# sourceMappingURL=product-telemetry.js.map