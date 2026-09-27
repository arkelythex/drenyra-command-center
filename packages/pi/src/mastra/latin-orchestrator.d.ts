import type { AgentContext } from "../types/agent-context";
import type { LatinAgentId } from "../types/latin-agent";
import type { DomainAgent } from "./domain-agent";
import { type PhaseTiming, type SwarmMode } from "./supervisor";
export interface LatinOrchestrationResult {
    success: boolean;
    data: unknown;
    conflicts: Array<{
        between: string[];
        field: string;
        values: unknown[];
        resolvedBy: string;
    }>;
    traceId: string;
    sessionId: string;
    timings: PhaseTiming[];
}
export interface LatinModernoOrchestratorOptions {
    mode: SwarmMode;
}
export declare class LatinModernoOrchestrator {
    private readonly domainAgents;
    private readonly taskDecomposer;
    private readonly resultMerger;
    private readonly supervisor;
    private readonly sessionManager;
    constructor(_options?: LatinModernoOrchestratorOptions);
    registerDomainAgent(agent: DomainAgent & {
        id: LatinAgentId;
    }): void;
    getDomainAgent(id: LatinAgentId): DomainAgent | undefined;
    getAllDomainAgents(): DomainAgent[];
    handleRequest(intent: string, context: AgentContext, sessionId?: string): Promise<LatinOrchestrationResult>;
}
//# sourceMappingURL=latin-orchestrator.d.ts.map