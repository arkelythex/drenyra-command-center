import type { AgentContext, AgentSession } from "../types/erp-types";
export declare class SessionManager {
    private readonly sessions;
    private readonly ttlMs;
    constructor(ttlMs?: number);
    create(goal: string, context: AgentContext): AgentSession;
    get(id: string): AgentSession | undefined;
    update(id: string, partial: Partial<AgentSession>): void;
    addStep(sessionId: string, domain: string): string | undefined;
    updateStep(sessionId: string, stepId: string, partial: Partial<AgentSession["steps"][0]>): void;
    listAll(): AgentSession[];
    cleanup(): number;
    getActiveSessions(): AgentSession[];
}
//# sourceMappingURL=session-manager.d.ts.map