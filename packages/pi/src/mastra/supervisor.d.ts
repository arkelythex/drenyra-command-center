import type { Conflict } from "./result-merger";
export interface PhaseTiming {
    domain: string;
    startedAt: Date;
    completedAt: Date;
    durationMs: number;
}
export type SwarmMode = "flat" | "hierarchy";
export declare class Supervisor {
    private readonly timings;
    resolveConflicts(conflicts: Conflict[], strategy?: "highest-confidence" | "majority" | "latest"): Conflict[];
    canProceed(results: Array<{
        domainId: string;
        status: string;
    }>): {
        proceed: boolean;
        reason?: string;
    };
    recordTiming(domain: string, startedAt: Date, completedAt: Date): void;
    getTimings(): PhaseTiming[];
    getPerformanceSummary(): {
        totalDurationMs: number;
        totalPhases: number;
        slowest: PhaseTiming | undefined;
        fastest: PhaseTiming | undefined;
    };
}
//# sourceMappingURL=supervisor.d.ts.map