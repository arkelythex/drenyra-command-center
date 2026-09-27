class CircuitBreaker {
    threshold;
    timeoutMs;
    failures = 0;
    lastFailureTime;
    state = "CLOSED";
    constructor(threshold, timeoutMs) {
        this.threshold = threshold;
        this.timeoutMs = timeoutMs;
    }
    async execute(fn) {
        if (this.state === "OPEN") {
            if (Date.now() - (this.lastFailureTime || 0) > this.timeoutMs) {
                this.state = "HALF_OPEN";
            }
            else {
                throw new Error("Circuit breaker is OPEN");
            }
        }
        try {
            const result = await fn();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        this.failures = 0;
        this.state = "CLOSED";
    }
    onFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();
        if (this.failures >= this.threshold) {
            this.state = "OPEN";
        }
    }
    getState() {
        return this.state;
    }
}
class AgentMetricsCollector {
    metrics = new Map();
    startAgent(agentName) {
        const metric = {
            agentName,
            startTime: Date.now(),
            status: "running",
            retryCount: 0,
        };
        return metric;
    }
    finishAgent(metric, status, error) {
        metric.endTime = Date.now();
        metric.duration = metric.endTime - metric.startTime;
        metric.status = status;
        if (error)
            metric.error = error;
        const agentMetrics = this.metrics.get(metric.agentName) || [];
        agentMetrics.push(metric);
        this.metrics.set(metric.agentName, agentMetrics);
    }
    getMetrics(agentName) {
        if (agentName) {
            return this.metrics.get(agentName) || [];
        }
        return this.metrics;
    }
    getSuccessRate(agentName) {
        const agentMetrics = this.metrics.get(agentName) || [];
        if (agentMetrics.length === 0)
            return 0;
        const successful = agentMetrics.filter((m) => m.status === "success").length;
        return successful / agentMetrics.length;
    }
    getAverageProcessingTime(agentName) {
        const agentMetrics = this.metrics.get(agentName) || [];
        const completed = agentMetrics.filter((m) => m.duration !== undefined);
        if (completed.length === 0)
            return 0;
        const total = completed.reduce((sum, m) => sum + (m.duration || 0), 0);
        return total / completed.length;
    }
}
export { AgentMetricsCollector, CircuitBreaker };
//# sourceMappingURL=steps.js.map