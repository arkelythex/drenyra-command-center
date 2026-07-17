import type { AgentHandler } from "../types.js";
export declare function createDefaultHandler(agentId: string): AgentHandler;
export declare function registerDefaultHandlers(registry: Map<string, AgentHandler>, agentIds?: string[]): void;
export declare function validateSpawnPlan(parentId: string, spawn: {
    agentId: string;
}[]): string[];
//# sourceMappingURL=defaults.d.ts.map