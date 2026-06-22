import { SecureLogger } from "@arkelythex/shared/secure-logger";
import { EventEmitter } from "events";
import { DoraMetrics } from "./orchestrator-2026.dora-metrics";
import { MessageBus } from "./orchestrator-2026.message-bus";
import { AgentRegistry } from "./orchestrator-2026.registry";
import { WorkerPool } from "./orchestrator-2026.worker-pool";
export class AgentOrchestrator {
    workerPool;
    agentRegistry;
    messageBus;
    doraMetrics;
    eventEmitter = new EventEmitter();
    constructor(workerPoolSize) {
        this.workerPool = new WorkerPool(workerPoolSize);
        this.agentRegistry = new AgentRegistry();
        this.messageBus = new MessageBus();
        this.doraMetrics = new DoraMetrics();
    }
    registerAgent(agent) {
        this.agentRegistry.register(agent);
    }
    async executeParallel(task, agentIds, strategy = "all-results") {
        const context = {
            traceId: `trace-${Date.now()}`,
            startTime: new Date(),
            strategy: {
                type: "parallel",
                maxConcurrency: agentIds.length,
                timeout: 60000,
                retryFailedAgents: true,
                aggregationStrategy: strategy,
            },
            agents: agentIds,
            results: [],
            errors: [],
        };
        SecureLogger.info("Starting parallel execution", {
            traceId: context.traceId,
            agents: agentIds.length,
            taskId: task.id,
        });
        const promises = agentIds.map(async (agentId) => {
            const agent = this.agentRegistry
                .discover({})
                .find((a) => a.id === agentId);
            if (!agent)
                throw new Error(`Agent not found: ${agentId}`);
            try {
                const result = await this.workerPool.execute(task, agent);
                context.results.push(result);
                this.eventEmitter.emit("agent:complete", result);
                return result;
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                context.errors.push(err);
                SecureLogger.error(`Agent ${agentId} failed`, { error: err.message });
                throw err;
            }
        });
        const results = await Promise.allSettled(promises);
        const successful = results
            .filter((r) => r.status === "fulfilled")
            .map((r) => r.value);
        return this.aggregateResults(successful, strategy);
    }
    async decomposeAndExecute(complexTask) {
        const subtasks = await this.autoDecompose(complexTask);
        SecureLogger.info("Task auto-decomposed", {
            taskId: complexTask.id,
            subtasks: subtasks.length,
        });
        const results = [];
        for (const subtask of subtasks) {
            const agents = this.agentRegistry.discover({
                capabilities: [subtask.type],
            });
            if (agents.length === 0)
                throw new Error(`No agents available for task type: ${subtask.type}`);
            const result = await this.executeParallel(subtask, [agents[0].id], "first-wins");
            results.push(...result);
        }
        return results;
    }
    async autoDecompose(task) {
        const decompositionRules = [
            {
                pattern: /code.*review/i,
                types: [
                    "security-analysis",
                    "quality-analysis",
                    "performance-analysis",
                ],
            },
            {
                pattern: /refactor/i,
                types: ["impact-analysis", "component-refactor", "verification"],
            },
            { pattern: /deploy/i, types: ["build", "test", "deploy", "verify"] },
        ];
        const matchingRule = decompositionRules.find((rule) => rule.pattern.test(task.payload.description ?? ""));
        if (matchingRule)
            return matchingRule.types.map((type, index) => ({
                id: `${task.id}-sub-${index}`,
                type,
                payload: { description: `${task.payload.description ?? ""} - ${type}` },
                metadata: task.metadata,
            }));
        return [task];
    }
    aggregateResults(results, strategy) {
        switch (strategy) {
            case "first-wins":
                return results.length > 0 ? [results[0]] : [];
            case "consensus": {
                const resultCounts = new Map();
                results.forEach((r) => {
                    const key = JSON.stringify(r.data);
                    resultCounts.set(key, (resultCounts.get(key) || 0) + 1);
                });
                let maxCount = 0;
                let consensusResult;
                resultCounts.forEach((count, key) => {
                    if (count > maxCount) {
                        maxCount = count;
                        consensusResult = results.find((r) => JSON.stringify(r.data) === key);
                    }
                });
                return consensusResult ? [consensusResult] : results;
            }
            case "weighted-voting":
                return results.map((r) => ({ ...r, weight: 1 }));
            case "all-results":
            default:
                return results;
        }
    }
    async coordinate(agentIds, task) {
        agentIds.forEach((agentId) => {
            this.messageBus.subscribe(`agent:${agentId}`, (message) => {
                SecureLogger.info(`Message received by ${agentId}`, { message });
            });
        });
        return this.executeParallel(task, agentIds, "consensus");
    }
    getDoraMetrics() {
        return this.doraMetrics.getMetrics();
    }
    getHealthMetrics() {
        return {
            workerPool: this.workerPool.getMetrics(),
            dora: this.doraMetrics.getMetrics(),
        };
    }
    shutdown() {
        this.workerPool.terminate();
        SecureLogger.info("AgentOrchestrator shutdown complete");
    }
}
export function createOrchestrator(options) {
    return new AgentOrchestrator(options?.workerPoolSize);
}
export const orchestrator = createOrchestrator();
//# sourceMappingURL=orchestrator-2026.js.map