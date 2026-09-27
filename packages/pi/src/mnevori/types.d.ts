import type { FiscalPhaseId } from "../phase/types";
export interface MnevoriArtifact {
    id: string;
    ruc: string;
    periodo: string;
    phaseId: FiscalPhaseId;
    type: "gate_result" | "agent_output" | "phase_snapshot";
    payload: unknown;
    version: number;
    tier: "T1_WEAK" | "T2_STRONG" | "T3_CRITICAL";
    persistedAt: string;
}
export interface MnevoriResumePoint {
    ruc: string;
    periodo: string;
    lastPhaseId: FiscalPhaseId;
    lastStatus: "completed" | "blocked" | "in_progress";
    regulationVersion: string;
    lastPersistedAt: string;
}
export interface MnevoriPhaseSnapshot {
    ruc: string;
    periodo: string;
    phaseId: FiscalPhaseId;
    status: string;
    agentOutput: unknown;
    gateResults: unknown[];
    persistedAt: string;
}
export interface RegulationVersion {
    regulationId: string;
    version: string;
    effectiveAt: string;
    deprecatedAt?: string;
}
//# sourceMappingURL=types.d.ts.map