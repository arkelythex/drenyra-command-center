import type { ChatMessage } from "../gateway/types";
export interface ContextUsage {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    modelContextWindow: number;
    modelId: string;
    usageRatio: number;
    lastChecked: Date;
}
export interface ContextThresholdEvent {
    runId: string;
    usage: ContextUsage;
    threshold: number;
    modelId: string;
    timestamp: Date;
}
export interface ContextMonitorConfig {
    enabled: boolean;
    threshold: number;
}
export interface RunUsage {
    runId: string;
    modelId: string;
    contextWindow: number;
    totalTokens: number;
    eventsLogged: boolean;
}
export type PrunerStrategy = "sliding-window" | "summarization" | "disabled";
export interface ContextPrunerConfig {
    strategy: PrunerStrategy;
    maxMessages: number;
    tokenBudgetRatio: number;
    enableSummarization: boolean;
    summarizationModel?: string;
}
export interface PruneResult {
    messages: ChatMessage[];
    strategy: PrunerStrategy;
    tokensBefore: number;
    tokensAfter: number;
}
export interface TokenBudget {
    maxTokens: number;
    contextWindow: number;
    ratio: number;
}
//# sourceMappingURL=context-monitor.types.d.ts.map