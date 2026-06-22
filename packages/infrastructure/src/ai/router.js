import { loggers } from "../logger";
import { getModelForTask } from "./models";
const MODEL_COSTS = {
    flash: {
        input: 0.000075,
        output: 0.0003,
    },
    reasoning: {
        input: 0.003,
        output: 0.015,
    },
    opus: {
        input: 0.015,
        output: 0.075,
    },
};
class AdaptiveRouter {
    metrics = [];
    async route(task) {
        const model = getModelForTask(task);
        const startTime = Date.now();
        return {
            model,
            recordMetrics: (inputTokens, outputTokens, success) => {
                const duration = Date.now() - startTime;
                const modelType = this.getModelType(task);
                const cost = this.calculateCost(modelType, inputTokens, outputTokens);
                const metric = {
                    task,
                    model: modelType,
                    inputTokens,
                    outputTokens,
                    cost,
                    duration,
                    timestamp: new Date(),
                    success,
                };
                this.metrics.push(metric);
                if (cost > 0.01) {
                    loggers.ai.warn("Expensive operation detected", { task, cost });
                }
            },
        };
    }
    getModelType(task) {
        if (task === "OCR" || task === "EXTRACTION")
            return "flash";
        if (task === "ANALYSIS")
            return "opus";
        return "reasoning";
    }
    calculateCost(modelType, inputTokens, outputTokens) {
        const costs = MODEL_COSTS[modelType];
        const inputCost = (inputTokens / 1000) * costs.input;
        const outputCost = (outputTokens / 1000) * costs.output;
        return inputCost + outputCost;
    }
    getStats() {
        if (this.metrics.length === 0) {
            return {
                totalCost: 0,
                totalRequests: 0,
                avgDuration: 0,
                successRate: 0,
                byTask: {},
            };
        }
        const totalCost = this.metrics.reduce((sum, m) => sum + m.cost, 0);
        const totalRequests = this.metrics.length;
        const avgDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests;
        const successRate = this.metrics.filter((m) => m.success).length / totalRequests;
        const byTask = this.metrics.reduce((acc, m) => {
            if (!acc[m.task]) {
                acc[m.task] = {
                    count: 0,
                    totalCost: 0,
                    avgDuration: 0,
                    successRate: 0,
                };
            }
            const taskMetrics = acc[m.task];
            if (taskMetrics) {
                taskMetrics.count++;
                taskMetrics.totalCost += m.cost;
                taskMetrics.avgDuration += m.duration;
            }
            return acc;
        }, {});
        for (const task in byTask) {
            const metrics = this.metrics.filter((m) => m.task === task);
            const taskMetrics = byTask[task];
            if (taskMetrics) {
                taskMetrics.avgDuration = taskMetrics.avgDuration / taskMetrics.count;
                taskMetrics.successRate =
                    metrics.filter((m) => m.success).length / metrics.length;
            }
        }
        return {
            totalCost,
            totalRequests,
            avgDuration,
            successRate,
            byTask,
        };
    }
    clearMetrics() {
        this.metrics = [];
    }
}
export const aiRouter = new AdaptiveRouter();
export function logAIOperation(task, cost, duration) {
    loggers.ai.info("AI operation completed", { task, cost, duration });
}
//# sourceMappingURL=router.js.map