import { nowTimestamp } from "./types";
export const DEFAULT_CIRCUIT_BREAKER = {
    failureThreshold: 5,
    resetTimeoutMs: 30_000,
    halfOpenSuccessThreshold: 2,
};
export class CircuitBreaker {
    state;
    constructor(name, config) {
        this.state = {
            name,
            state: "closed",
            failureCount: 0,
            successCount: 0,
            config: { ...DEFAULT_CIRCUIT_BREAKER, ...config },
        };
    }
    get name() { return this.state.name; }
    get currentState() { return this.state.state; }
    get failureCount() { return this.state.failureCount; }
    allowsRequest() {
        if (this.state.state === "closed")
            return true;
        if (this.state.state === "open") {
            if (this.state.openedAt) {
                const elapsed = Date.now() - this.state.openedAt.unix;
                if (elapsed >= this.state.config.resetTimeoutMs) {
                    this.state = { ...this.state, state: "half_open", successCount: 0 };
                    return true;
                }
            }
            return false;
        }
        return true;
    }
    recordSuccess() {
        this.state = {
            ...this.state,
            state: this.state.state === "half_open"
                ? (this.state.successCount + 1 >= this.state.config.halfOpenSuccessThreshold ? "closed" : "half_open")
                : "closed",
            failureCount: 0,
            successCount: this.state.successCount + 1,
            lastSuccessAt: nowTimestamp(),
        };
    }
    recordFailure() {
        this.state = {
            ...this.state,
            state: this.state.failureCount + 1 >= this.state.config.failureThreshold ? "open" : this.state.state,
            failureCount: this.state.failureCount + 1,
            successCount: 0,
            lastFailureAt: nowTimestamp(),
            openedAt: this.state.failureCount + 1 >= this.state.config.failureThreshold
                ? nowTimestamp()
                : this.state.openedAt,
        };
    }
    reset() {
        this.state = {
            ...this.state,
            state: "closed",
            failureCount: 0,
            successCount: 0,
            openedAt: undefined,
        };
    }
    toJSON() {
        return { ...this.state };
    }
}
export function generateRecoveryPlan(workspaceId, capabilities) {
    const steps = [
        `1. Investigate workspace "${workspaceId}" — check agents, logs, and external services`,
        `2. Rediscover workspace state by re-running the last known operation`,
        `3. If rediscovery succeeds: resolve to "queued" and resume`,
        `4. If rediscovery fails: mark as "failed" and investigate root cause`,
        `5. Document the resolution in the workspace metadata`,
    ];
    if (capabilities.includes("sire")) {
        steps.push("6. Verify SIRE connection: check SUNAT API availability and credentials");
    }
    if (capabilities.includes("banking")) {
        steps.push("7. Verify banking connection: check Prometeo/banking provider status");
    }
    return steps;
}
//# sourceMappingURL=degraded.js.map