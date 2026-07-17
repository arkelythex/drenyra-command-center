import type { AgentHandler, HarnessExecuteRequest, HarnessExecuteResponse, HarnessOptions, HarnessRunNode, HarnessSpawnRequest } from "./types.js";
export declare class ArkelythexHarness {
    private readonly maxDepth;
    private readonly handlers;
    private readonly onApprovalRequired?;
    constructor(options?: HarnessOptions);
    registerHandler(agentId: string, handler: AgentHandler): void;
    getRegisteredAgents(): string[];
    canSpawnAgent(parentId: string, childId: string, depth: number): boolean;
    execute(request: HarnessExecuteRequest): Promise<HarnessExecuteResponse>;
    spawn(request: HarnessSpawnRequest): Promise<HarnessRunNode>;
    private runSpawnChildren;
    private run;
    private blockedNode;
}
export declare function createArkelythexHarness(options?: HarnessOptions): ArkelythexHarness;
//# sourceMappingURL=harness.d.ts.map