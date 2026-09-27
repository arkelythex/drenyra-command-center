import type { LanguageModel } from "ai";
export interface AgentUIStreamConfig {
    model: LanguageModel;
    system: string;
    prompt: string;
    tools: Record<string, unknown>;
    maxSteps?: number;
}
export interface AgentUIEvent {
    type: "text-delta" | "step-finish" | "error" | "done";
    content: string;
    stepNumber?: number;
    toolCalls?: Array<{
        toolName: string;
        input: unknown;
        output: unknown;
    }>;
}
export declare function createAgentUIReadableStream(config: AgentUIStreamConfig): ReadableStream<Uint8Array>;
//# sourceMappingURL=agent-ui-stream.d.ts.map