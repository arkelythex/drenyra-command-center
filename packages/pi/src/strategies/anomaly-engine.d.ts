import type { AgentEventBus } from "../mastra/event-bus";
import type { AgentContext } from "../types/agent-context";
import type { Anomaly, AnomalyStrategy, FiscalAnomalyEngineOptions, StrategyRunResult } from "./types";
export declare class FiscalAnomalyEngine {
    private readonly strategies;
    private readonly eventBus?;
    private readonly publishThreshold;
    private readonly trackPerformance;
    constructor(initialStrategies?: AnomalyStrategy[], eventBus?: AgentEventBus, options?: FiscalAnomalyEngineOptions);
    addStrategy(strategy: AnomalyStrategy): void;
    removeStrategy(id: string): boolean;
    getStrategy(id: string): AnomalyStrategy | undefined;
    listStrategies(): AnomalyStrategy[];
    replaceStrategy(strategy: AnomalyStrategy): void;
    runAll(data: unknown, context: AgentContext): Promise<StrategyRunResult[]>;
    runAllFlat(data: unknown, context: AgentContext): Promise<Anomaly[]>;
    runStrategy(id: string, data: unknown, context: AgentContext): Promise<StrategyRunResult>;
    private runSingle;
    private publishAnomalies;
}
//# sourceMappingURL=anomaly-engine.d.ts.map