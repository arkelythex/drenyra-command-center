export class TaskRouter {
    agents = new Map();
    performance = new Map();
    patterns = new Map();
    taskCount = 0;
    options;
    constructor(options = {}) {
        this.options = {
            enableDoraRouting: options.enableDoraRouting ?? false,
            minConfidence: options.minConfidence ?? 0.3,
        };
        this.initializeDefaultPatterns();
    }
    initializeDefaultPatterns() {
        this.patterns.set("analysis", [
            /analy(s|z)e?|review|inspect|examine|study/i,
        ]);
        this.patterns.set("compliance", [
            /compliance|audit|regulation|policy|standard|rule/i,
        ]);
        this.patterns.set("security", [
            /security|vulnerability|threat|exploit|xss|injection|auth/i,
        ]);
        this.patterns.set("performance", [
            /performance|optimization|latency|throughput|speed|slow/i,
        ]);
        this.patterns.set("data", [
            /data|analytics|aggregat(e|ion)|report|statistics|insight/i,
        ]);
    }
    registerAgent(agent) {
        this.agents.set(agent.id, agent);
        if (!this.performance.has(agent.id)) {
            this.performance.set(agent.id, {
                totalTasks: 0,
                successfulTasks: 0,
                totalDuration: 0,
                failures: 0,
            });
        }
    }
    unregisterAgent(agentId) {
        this.agents.delete(agentId);
        this.performance.delete(agentId);
    }
    recordResult(agentId, duration) {
        const perf = this.performance.get(agentId);
        if (perf) {
            perf.totalTasks++;
            perf.successfulTasks++;
            perf.totalDuration += duration;
        }
    }
    recordFailure(agentId) {
        const perf = this.performance.get(agentId);
        if (perf) {
            perf.totalTasks++;
            perf.failures++;
        }
    }
    addPattern(taskType, patterns) {
        this.patterns.set(taskType, patterns);
    }
    route(task) {
        const candidates = this.findCandidates(task);
        if (candidates.length === 0) {
            throw new Error(`No agents registered for task type: ${task.type}`);
        }
        if (this.options.enableDoraRouting) {
            return this.scoreAndSort(candidates);
        }
        return candidates.map((a) => a.id);
    }
    findCandidates(task) {
        const direct = Array.from(this.agents.values()).filter((a) => a.type === task.type);
        if (direct.length > 0)
            return direct;
        const classifiedType = this.classify(task);
        if (classifiedType) {
            const classified = Array.from(this.agents.values()).filter((a) => a.type === classifiedType);
            if (classified.length > 0)
                return classified;
        }
        return [];
    }
    classify(task) {
        const content = this.extractContent(task);
        for (const [type, regexes] of this.patterns) {
            let score = 0;
            for (const regex of regexes) {
                if (regex.test(content)) {
                    score += 0.5;
                }
            }
            if (score >= this.options.minConfidence) {
                return type;
            }
        }
        return undefined;
    }
    extractContent(task) {
        const parts = [task.type, String(task.priority)];
        if (task.input?.query)
            parts.push(String(task.input.query));
        if (task.input?.description)
            parts.push(String(task.input.description));
        if (task.metadata)
            parts.push(JSON.stringify(task.metadata));
        return parts.join(" ").toLowerCase();
    }
    scoreAndSort(candidates) {
        const scored = candidates.map((agent) => {
            const perf = this.performance.get(agent.id);
            let score = 0;
            if (perf && perf.totalTasks > 0) {
                const successRate = perf.successfulTasks / perf.totalTasks;
                score += successRate * 50;
                const avgDuration = perf.totalDuration / perf.totalTasks;
                const speedScore = Math.max(0, 30 - avgDuration / 100);
                score += speedScore;
                const failureRatio = perf.failures / perf.totalTasks;
                score += (1 - failureRatio) * 20;
            }
            else {
                score = 50;
            }
            return { id: agent.id, score };
        });
        scored.sort((a, b) => b.score - a.score);
        return scored.map((s) => s.id);
    }
    getStats() {
        return {
            totalAgents: this.agents.size,
            totalTasksRouted: this.taskCount,
        };
    }
}
//# sourceMappingURL=router.js.map