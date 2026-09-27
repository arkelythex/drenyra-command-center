import type { ChatMessage } from "../gateway/types";
import type { ContextPrunerConfig, PruneResult, TokenBudget } from "./context-monitor.types";
export type OnPruneApplied = (result: PruneResult, runId?: string) => void;
export type SummarizeFn = (messages: ChatMessage[]) => Promise<string>;
export declare class ContextPruner {
    config: ContextPrunerConfig;
    private onPruneApplied?;
    private summarizeFn?;
    constructor(config?: Partial<ContextPrunerConfig>, options?: {
        onPruneApplied?: OnPruneApplied;
        summarizeFn?: SummarizeFn;
    });
    prune(messages: ChatMessage[], runId?: string): PruneResult;
    private executeStrategy;
    slidingWindow(messages: ChatMessage[], maxMessages: number): ChatMessage[];
    summarize(messages: ChatMessage[]): ChatMessage[];
    summarizeAsync(messages: ChatMessage[]): Promise<ChatMessage[]>;
    calculateBudget(modelId: string, ratio?: number): TokenBudget;
    getEstimatedTokenCount(messages: ChatMessage[]): number;
    getCheapestFlashModel(): string;
    private noOpResult;
}
export declare function createContextPruner(config?: Partial<ContextPrunerConfig>, options?: {
    onPruneApplied?: OnPruneApplied;
    summarizeFn?: SummarizeFn;
}): ContextPruner;
//# sourceMappingURL=context-pruner.d.ts.map