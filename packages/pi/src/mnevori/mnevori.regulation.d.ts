import type { MnevoriArtifact, RegulationVersion } from "./types";
export type CacheStatus = "valid" | "needs_review" | "invalid";
export interface PhaseCacheInfo {
    phaseId: string;
    persistedAt: string;
    regulationVersion: string;
    cacheStatus: CacheStatus;
}
export declare class MnevoriRegulationTracker {
    private regulations;
    private currentVersion;
    constructor(currentVersion?: string);
    register(regulation: RegulationVersion): void;
    updateCurrentVersion(version: string): void;
    evaluateArtifactCache(artifact: MnevoriArtifact): CacheStatus;
    findStaleArtifacts(artifacts: MnevoriArtifact[]): MnevoriArtifact[];
}
//# sourceMappingURL=mnevori.regulation.d.ts.map