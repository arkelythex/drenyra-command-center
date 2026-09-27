import type { LexoriSkillContextResult } from "../_domain-types/domain-barrel";
import { LexoriSkillResolver } from "../lexori/lexori.resolver";
import type { AgentContext } from "../types/agent-context";
import type { AgentDefinition, AgentIntent } from "../types/erp-types";
import { ApprovalGateEngine } from "./approval-gate";
import { ApprovalStore } from "./approval-store";
import { AgentEventBus } from "./event-bus";
import { IntentDetector, type IntentHandler } from "./intent-detector";
import { LatinModernoOrchestrator } from "./latin-orchestrator";
export interface OrchestrationResult {
    sessionId: string;
    intent: AgentIntent;
    result: {
        success: boolean;
        data: unknown;
    } | {
        success: boolean;
        error: string;
    };
    agent: string;
    lexoriContext?: LexoriSkillContextResult[];
}
export declare class DrenyraOrchestrator {
    private readonly lexoriProvider?;
    private readonly agents;
    private readonly approvalGate;
    private readonly eventBus;
    private readonly detectIntent;
    private swarmOrchestrator?;
    private swarmMode;
    constructor(approvalGate: ApprovalGateEngine, eventBus: AgentEventBus, detectIntent: IntentHandler, lexoriProvider?: LexoriSkillResolver | undefined);
    registerAgent(agent: AgentDefinition): void;
    getAgent(id: string): AgentDefinition | undefined;
    getAllAgents(): AgentDefinition[];
    enableSwarmMode(orchestrator: LatinModernoOrchestrator): void;
    disableSwarmMode(): void;
    isSwarmMode(): boolean;
    handleInput(input: string, context: AgentContext, sessionId?: string): Promise<OrchestrationResult>;
    getApprovalGate(): ApprovalGateEngine;
    getEventBus(): AgentEventBus;
}
export declare function createDrenyraOrchestrator(options?: {
    governanceValidator?: (toolName: string, input: unknown, context: AgentContext) => Promise<{
        valid: boolean;
        reasons: string[];
        evidenceRefs: string[];
    }>;
    notifyCallback?: (request: unknown) => Promise<void>;
    swarmMode?: "flat" | "hierarchy";
    withLexori?: boolean;
}): {
    orchestrator: DrenyraOrchestrator;
    approvalStore: ApprovalStore;
    approvalGate: ApprovalGateEngine;
    eventBus: AgentEventBus;
    intentDetector: IntentDetector;
    latinOrchestrator?: LatinModernoOrchestrator;
    lexoriResolver?: LexoriSkillResolver;
};
//# sourceMappingURL=orchestrator.d.ts.map