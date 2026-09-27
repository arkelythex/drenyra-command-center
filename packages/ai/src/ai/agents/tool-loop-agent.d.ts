import type { LanguageModel } from "ai";
export interface ToolLoopAgentConfig {
    model: LanguageModel;
    system: string;
    prompt: string;
    tools: Record<string, unknown>;
    maxSteps?: number;
    maxTokens?: number;
}
export interface ToolLoopResult {
    text: string;
    steps: Array<{
        stepNumber: number;
        toolCalls: Array<{
            toolName: string;
            input: unknown;
            output: unknown;
        }>;
        text: string;
    }>;
    totalSteps: number;
}
export declare function runToolLoop(config: ToolLoopAgentConfig): Promise<ToolLoopResult>;
//# sourceMappingURL=tool-loop-agent.d.ts.map