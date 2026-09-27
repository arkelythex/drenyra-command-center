import { circuitBreakerRepo } from "@drenyra/infrastructure/services/error-recovery";
import { CircuitBreaker } from "../../agents/orchestrator/workflow-v2/steps";
export class PersistentCircuitBreaker {
    memory;
    state;
    cacheTimestamp;
    persistedState;
    CACHE_TTL = 5000;
    constructor(agentName, scope, threshold, timeoutMs) {
        this.state = { agentName, scope };
        this.memory = new CircuitBreaker(threshold ?? 5, timeoutMs ?? 60000);
        this.cacheTimestamp = 0;
        this.persistedState = null;
        this.syncFromDb().catch(() => {
        });
    }
    async isAvailable() {
        await this.syncFromDb();
        return this.resolveState() !== "OPEN";
    }
    async recordSuccess() {
        this.memory = new CircuitBreaker(5, 60000);
        this.cacheTimestamp = Date.now();
        this.persistedState = "CLOSED";
        await this.persistToDb("CLOSED", 0, 1);
    }
    async recordFailure() {
        this.cacheTimestamp = 0;
        await this.persistToDb("CLOSED", 1, 0);
    }
    getState() {
        return this.resolveState();
    }
    resolveState() {
        if (this.persistedState === "OPEN") {
            return "OPEN";
        }
        if (this.persistedState === "HALF_OPEN") {
            return "HALF_OPEN";
        }
        return this.memory.getState();
    }
    async syncFromDb() {
        const now = Date.now();
        if (now - this.cacheTimestamp < this.CACHE_TTL) {
            return;
        }
        try {
            const dbState = await circuitBreakerRepo.getState(this.state.agentName, this.state.scope);
            if (dbState) {
                this.persistedState = dbState.state;
                this.memory = new CircuitBreaker(dbState.threshold, dbState.timeoutMs);
            }
            this.cacheTimestamp = now;
        }
        catch {
        }
    }
    async persistToDb(state, failureCount, successCount) {
        try {
            await circuitBreakerRepo.upsertState({
                agentName: this.state.agentName,
                scope: this.state.scope,
                state,
                failureCount,
                successCount,
                threshold: 5,
                timeoutMs: 60000,
            });
        }
        catch {
        }
    }
}
//# sourceMappingURL=persistent-circuit-breaker.js.map