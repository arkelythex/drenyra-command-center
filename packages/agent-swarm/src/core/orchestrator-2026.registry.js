import { SecureLogger } from "@arkelythex/shared/secure-logger";
export class AgentRegistry {
    agents = new Map();
    healthStatus = new Map();
    register(agent) {
        this.agents.set(agent.id, agent);
        this.healthStatus.set(agent.id, {
            status: "healthy",
            lastCheck: new Date(),
        });
        SecureLogger.info(`Agent registered: ${agent.name}`, { agentId: agent.id });
    }
    discover(criteria) {
        const allAgents = Array.from(this.agents.values());
        if (criteria.capabilities)
            return allAgents.filter((agent) => criteria.capabilities.every((cap) => agent.capabilities.includes(cap)));
        if (criteria.priority !== undefined)
            return allAgents.filter((agent) => agent.priority >= criteria.priority);
        return allAgents;
    }
    getHealth(agentId) {
        return this.healthStatus.get(agentId);
    }
    async checkHealth(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent)
            return false;
        try {
            const healthTask = {
                id: `health-${Date.now()}`,
                type: "health-check",
                payload: {},
            };
            await agent.execute(healthTask);
            this.healthStatus.set(agentId, {
                status: "healthy",
                lastCheck: new Date(),
            });
            return true;
        }
        catch {
            this.healthStatus.set(agentId, { status: "down", lastCheck: new Date() });
            return false;
        }
    }
}
//# sourceMappingURL=orchestrator-2026.registry.js.map