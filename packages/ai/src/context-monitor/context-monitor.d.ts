import type { SessionStore } from "../session/session-store";
import type { ContextMonitorConfig, ContextUsage } from "./context-monitor.types";
export declare class ContextMonitor {
    private runs;
    private config;
    private sessionStore?;
    constructor(sessionStore?: SessionStore, config?: Partial<ContextMonitorConfig>);
    trackRequest(runId: string, modelId: string, usage: {
        promptTokens: number;
        completionTokens: number;
    }): void;
    shouldPrune(runId: string): boolean;
    getRunUsage(runId: string): ContextUsage | null;
    resetRun(runId: string): void;
    private resolveContextWindow;
    private persistUsageSnapshot;
    private persistThresholdEvent;
}
//# sourceMappingURL=context-monitor.d.ts.map