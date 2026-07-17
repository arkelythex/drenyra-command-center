export class Orchestrator {
    agents = new Map();
    tasksExecuted = 0;
    tasksFailed = 0;
    isShutdown = false;
    registerAgent(agent) {
        this.agents.set(agent.id, agent);
    }
    async execute(task) {
        if (this.isShutdown) {
            return this.failedResult(task.id, "Orchestrator is shut down");
        }
        const agent = this.findAgent(task);
        if (!agent) {
            return this.failedResult(task.id, `No agent registered for type: ${task.type}`);
        }
        try {
            const result = await agent.execute(task);
            this.tasksExecuted++;
            return result;
        }
        catch (error) {
            this.tasksFailed++;
            return this.failedResult(task.id, error instanceof Error ? error.message : String(error));
        }
    }
    async executeParallel(task, agentIds, strategy = "all-results") {
        if (agentIds.length === 0)
            return [];
        const promises = agentIds.map(async (agentId) => {
            const agent = this.agents.get(agentId);
            if (!agent) {
                return this.failedResult(task.id, `Agent not found: ${agentId}`);
            }
            try {
                const result = await agent.execute(task);
                this.tasksExecuted++;
                return result;
            }
            catch (error) {
                this.tasksFailed++;
                return this.failedResult(task.id, error instanceof Error ? error.message : String(error));
            }
        });
        const results = await Promise.all(promises);
        return this.aggregate(results, strategy);
    }
    shutdown() {
        this.isShutdown = true;
    }
    getHealthMetrics() {
        return {
            totalAgents: this.agents.size,
            tasksExecuted: this.tasksExecuted,
            tasksFailed: this.tasksFailed,
        };
    }
    findAgent(task) {
        for (const agent of this.agents.values()) {
            if (agent.type === task.type)
                return agent;
        }
        return undefined;
    }
    failedResult(taskId, error) {
        return {
            taskId,
            status: "failed",
            error,
            startedAt: new Date().toISOString(),
            attempts: 1,
        };
    }
    aggregate(results, strategy) {
        switch (strategy) {
            case "first-wins":
                return results.length > 0 ? [results[0]] : [];
            case "consensus": {
                const completed = results.filter((r) => r.status === "completed");
                return completed.length > 0 ? [completed[0]] : results.slice(0, 1);
            }
            case "all-results":
            default:
                return results;
        }
    }
}
//# sourceMappingURL=orchestrator.js.map