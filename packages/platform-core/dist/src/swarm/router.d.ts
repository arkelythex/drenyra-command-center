import type { TaskDefinition } from "../kernel/types.js";
export interface RegisteredAgent {
    id: string;
    type: string;
    capabilities: string[];
}
export interface RouterOptions {
    enableDoraRouting?: boolean;
    minConfidence?: number;
}
export interface RouterStats {
    totalAgents: number;
    totalTasksRouted: number;
}
export declare class TaskRouter {
    private agents;
    private performance;
    private patterns;
    private taskCount;
    private readonly options;
    constructor(options?: RouterOptions);
    private initializeDefaultPatterns;
    registerAgent(agent: RegisteredAgent): void;
    unregisterAgent(agentId: string): void;
    recordResult(agentId: string, duration: number): void;
    recordFailure(agentId: string): void;
    addPattern(taskType: string, patterns: RegExp[]): void;
    route(task: TaskDefinition): string[];
    private findCandidates;
    private classify;
    private extractContent;
    private scoreAndSort;
    getStats(): RouterStats;
}
//# sourceMappingURL=router.d.ts.map