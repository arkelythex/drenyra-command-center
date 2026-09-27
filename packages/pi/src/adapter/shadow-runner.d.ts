import type { AgentRuntimePort, CreateSessionRequest, FiscalPrompt } from "./port";
export interface ShadowComparison {
    sessionId: string;
    legacy: {
        success: boolean;
        durationMs: number;
        error?: string;
    };
    pi: {
        success: boolean;
        durationMs: number;
        error?: string;
    };
    match: boolean;
}
export declare class ShadowRunner {
    private readonly legacy;
    private readonly pi;
    constructor(legacy: AgentRuntimePort, pi: AgentRuntimePort);
    createSession(request: CreateSessionRequest): Promise<ShadowComparison>;
    comparePrompt(sessionId: string, input: FiscalPrompt): Promise<{
        legacy: {
            durationMs: number;
            error?: string;
        };
        pi: {
            durationMs: number;
            error?: string;
        };
        match: boolean;
    }>;
    compareAbort(sessionId: string): Promise<{
        match: boolean;
    }>;
}
//# sourceMappingURL=shadow-runner.d.ts.map