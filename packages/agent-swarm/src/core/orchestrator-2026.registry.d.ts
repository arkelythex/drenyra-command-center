import type { Agent } from "../agents/types.js";
export declare class AgentRegistry {
    private agents;
    private healthStatus;
    register(agent: Agent): void;
    discover(criteria: {
        capabilities?: string[];
        priority?: number;
    }): Agent[];
    getHealth(agentId: string): {
        status: "healthy" | "degraded" | "down";
        lastCheck: Date;
    } | undefined;
    checkHealth(agentId: string): Promise<boolean>;
}
//# sourceMappingURL=orchestrator-2026.registry.d.ts.map