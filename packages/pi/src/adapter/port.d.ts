import type { AgentContext } from "@drenyra/fiscal-agent-domain/agent-context";
export interface SessionHandle {
    readonly sessionId: string;
    readonly createdAt: Date;
}
export interface FiscalPrompt {
    text: string;
    context: AgentContext;
    images?: Array<{
        type: "image";
        source: {
            type: "base64";
            mediaType: string;
            data: string;
        };
    }>;
}
export type RuntimeEventType = "message_delta" | "thinking_delta" | "tool_execution_start" | "tool_execution_end" | "turn_start" | "turn_end" | "agent_start" | "agent_end" | "error";
export interface RuntimeEvent {
    type: RuntimeEventType;
    sessionId: string;
    timestamp: Date;
    payload: unknown;
}
export type RuntimeEventListener = (event: RuntimeEvent) => void;
export interface CreateSessionRequest {
    goal: string;
    context: AgentContext;
    parentSessionId?: string;
    model?: string;
}
export interface ForkSessionRequest {
    sourceSessionId: string;
    context: AgentContext;
    entryId?: string;
}
export type Unsubscribe = () => void;
export interface AgentRuntimePort {
    createSession(request: CreateSessionRequest): Promise<SessionHandle>;
    prompt(sessionId: string, input: FiscalPrompt): Promise<void>;
    subscribe(sessionId: string, listener: RuntimeEventListener): Unsubscribe;
    fork(request: ForkSessionRequest): Promise<SessionHandle>;
    abort(sessionId: string): Promise<void>;
    getSession(sessionId: string): Promise<{
        status: string;
        messageCount: number;
    } | null>;
}
//# sourceMappingURL=port.d.ts.map