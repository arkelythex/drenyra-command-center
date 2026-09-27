import { dlqRepo } from "@drenyra/infrastructure/services/error-recovery";
import { classifyError } from "./agent-error";
const DEFAULT_RETRY_CONFIG = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    useJitter: true,
    retryableErrors: ["TRANSIENT", "UNKNOWN"],
};
export class RetryEngine {
    dlqRepo;
    constructor() {
        this.dlqRepo = dlqRepo;
    }
    async executeWithRetry(fn, context, config) {
        const cfg = { ...DEFAULT_RETRY_CONFIG, ...config };
        for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
            try {
                const result = await fn();
                return { result, retries: attempt };
            }
            catch (err) {
                const agentError = classifyError(err, context.agentName);
                if (!cfg.retryableErrors.includes(agentError.type)) {
                    return { error: agentError, retries: attempt };
                }
                if (attempt >= cfg.maxRetries) {
                    await this.enqueueForRetry(context.runId, context.agentName, agentError, context.workflowState, undefined, context.input);
                    return { error: agentError, retries: attempt + 1 };
                }
                const delay = this.calculateDelay(attempt, cfg);
                await this.sleep(delay);
            }
        }
        return { retries: cfg.maxRetries + 1 };
    }
    async enqueueForRetry(runId, agentName, error, workflowState, batchId, _input) {
        const now = new Date();
        const retryDelay = error.type === "TRANSIENT" ? 5000 : 30000;
        const nextRetryAt = new Date(now.getTime() + retryDelay);
        await this.dlqRepo.enqueue({
            runId,
            agentName,
            errorType: error.type,
            errorMessage: error.message,
            errorDetails: error.details,
            workflowState: workflowState ?? null,
            retryCount: 0,
            maxRetries: 3,
            lastRetryAt: null,
            nextRetryAt,
            status: "pending",
            companyId: null,
            batchId: batchId ?? null,
        });
    }
    async processPendingRetries(limit) {
        return this.processPendingItems(limit);
    }
    async processPendingItems(limit, processor) {
        const items = await this.dlqRepo.dequeue(limit ?? 10);
        if (!processor) {
            return items.length;
        }
        let processed = 0;
        for (const item of items) {
            try {
                const retryDelay = item.errorType === "TRANSIENT" ? 5000 : 30000;
                const nextRetryAt = new Date(Date.now() + retryDelay);
                await this.dlqRepo.incrementRetry(item.id, nextRetryAt);
                await processor({
                    id: item.id,
                    runId: item.runId,
                    agentName: item.agentName,
                    input: item.errorDetails ?? undefined,
                });
                await this.dlqRepo.markResolved(item.id);
                processed++;
            }
            catch {
                const maxRetries = item.maxRetries;
                const currentRetry = item.retryCount + 1;
                if (currentRetry >= maxRetries) {
                    await this.dlqRepo.markDead(item.id);
                }
            }
        }
        return processed;
    }
    calculateDelay(attempt, config) {
        const exponential = config.baseDelayMs * 2 ** attempt;
        const jitter = config.useJitter
            ? Math.random() * (config.baseDelayMs / 2)
            : 0;
        return Math.min(exponential + jitter, config.maxDelayMs);
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=retry-engine.js.map