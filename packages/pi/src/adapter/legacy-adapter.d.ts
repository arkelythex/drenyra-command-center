import type { AgentRuntimePort, SessionHandle, FiscalPrompt, RuntimeEventListener, CreateSessionRequest, ForkSessionRequest, Unsubscribe } from "./port";
export declare class LegacyMastraRuntimeAdapter implements AgentRuntimePort {
    private sessions;
    createSession(request: CreateSessionRequest): Promise<SessionHandle>;
    prompt(_sessionId: string, _input: FiscalPrompt): Promise<void>;
    subscribe(_sessionId: string, _listener: RuntimeEventListener): Unsubscribe;
    fork(_request: ForkSessionRequest): Promise<SessionHandle>;
    abort(sessionId: string): Promise<void>;
    getSession(sessionId: string): Promise<{
        status: string;
        messageCount: number;
    } | null>;
}
//# sourceMappingURL=legacy-adapter.d.ts.map