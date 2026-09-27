import type { AgentRuntimePort, SessionHandle, FiscalPrompt, RuntimeEventListener, CreateSessionRequest, ForkSessionRequest, Unsubscribe } from "./port";
export declare class PiAgentRuntimeAdapter implements AgentRuntimePort {
    private sessions;
    createSession(_request: CreateSessionRequest): Promise<SessionHandle>;
    prompt(sessionId: string, input: FiscalPrompt): Promise<void>;
    subscribe(sessionId: string, listener: RuntimeEventListener): Unsubscribe;
    fork(request: ForkSessionRequest): Promise<SessionHandle>;
    abort(sessionId: string): Promise<void>;
    getSession(sessionId: string): Promise<{
        status: string;
        messageCount: number;
    } | null>;
    private mapPiEvent;
}
//# sourceMappingURL=pi-adapter.d.ts.map