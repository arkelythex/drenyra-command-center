import type { SessionManager } from "../mastra/session-manager.js";
import type { AgentType, TaskDefinition } from "../kernel/types.js";
export interface DomainRegistry {
    registerEntity(name: string, schema: unknown): void;
    registerRule(name: string, rule: (input: unknown) => boolean): void;
}
export interface AgentRegistry {
    registerAgentType(type: AgentType, factory: () => unknown): void;
    registerCapability(agentType: AgentType, capability: string): void;
}
export interface PolicyRegistry {
    registerPolicy(name: string, policy: PolicyDefinition): void;
}
export interface ApprovalGateRegistry {
    registerGate(name: string, gate: ApprovalGate): void;
}
export interface PolicyDefinition {
    description: string;
    evaluate: (context: PolicyContext) => PolicyResult;
}
export interface PolicyContext {
    action: string;
    agentType: AgentType;
    task: TaskDefinition;
    metadata?: Record<string, unknown>;
}
export interface PolicyResult {
    allowed: boolean;
    reason?: string;
    requiresApproval?: boolean;
}
export interface ApprovalGate {
    name: string;
    description: string;
    evaluate: (request: ApprovalRequest) => Promise<ApprovalVerdict>;
}
export interface ApprovalRequest {
    id: string;
    action: string;
    agentId: string;
    taskId: string;
    evidence: ApprovalEvidence[];
    metadata?: Record<string, unknown>;
}
export interface ApprovalEvidence {
    type: string;
    content: unknown;
    timestamp: string;
}
export interface ApprovalVerdict {
    approved: boolean;
    approvedBy?: string;
    reason?: string;
    timestamp: string;
}
export interface AgenticOSPlugin {
    name: string;
    version: string;
    description: string;
    registerDomain(registry: DomainRegistry): void;
    registerAgents(registry: AgentRegistry): void;
    registerPolicies(registry: PolicyRegistry): void;
    registerApprovalGates(registry: ApprovalGateRegistry): void;
}
export interface SkillContext {
    sessionManager: SessionManager;
    logger: {
        info: (msg: string) => void;
        warn: (msg: string) => void;
        error: (msg: string) => void;
    };
    config: Record<string, unknown>;
}
export interface DrenyraSkill {
    id: string;
    name: string;
    version: string;
    description: string;
    strategies?: Array<{
        name: string;
        execute: (input: unknown, context: Record<string, unknown>) => Promise<unknown>;
    }>;
    commands?: Array<{
        name: string;
        description: string;
        execute: (args: string[]) => Promise<void>;
    }>;
    initialize(context: SkillContext): Promise<void>;
}
//# sourceMappingURL=interface.d.ts.map