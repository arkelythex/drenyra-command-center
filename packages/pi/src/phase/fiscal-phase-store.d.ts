import type { FiscalPeriodState, FiscalPhaseId, GateResult, PhaseHistoryEntry, PhaseStatus } from "./types";
export interface FiscalPhaseStore {
    getPeriodState(ruc: string, periodo: string): Promise<FiscalPeriodState | undefined>;
    upsertPeriodState(state: FiscalPeriodState): Promise<void>;
    updatePhaseStatus(ruc: string, periodo: string, phaseId: FiscalPhaseId, status: PhaseStatus): Promise<FiscalPeriodState | undefined>;
    addGateResult(ruc: string, periodo: string, phaseId: FiscalPhaseId, gateResult: GateResult): Promise<void>;
    addPhaseHistoryEntry(ruc: string, periodo: string, entry: PhaseHistoryEntry): Promise<void>;
    listPeriodsByStatus(ruc: string, status: PhaseStatus): Promise<Array<{
        periodo: string;
        currentPhase: FiscalPhaseId;
    }>>;
    listActivePeriods(): Promise<Array<{
        ruc: string;
        periodo: string;
    }>>;
}
export declare class InMemoryFiscalPhaseStore implements FiscalPhaseStore {
    private readonly states;
    private key;
    getPeriodState(ruc: string, periodo: string): Promise<FiscalPeriodState | undefined>;
    upsertPeriodState(state: FiscalPeriodState): Promise<void>;
    updatePhaseStatus(ruc: string, periodo: string, phaseId: FiscalPhaseId, status: PhaseStatus): Promise<FiscalPeriodState | undefined>;
    addGateResult(ruc: string, periodo: string, phaseId: FiscalPhaseId, gateResult: GateResult): Promise<void>;
    addPhaseHistoryEntry(ruc: string, periodo: string, entry: PhaseHistoryEntry): Promise<void>;
    listPeriodsByStatus(ruc: string, status: PhaseStatus): Promise<Array<{
        periodo: string;
        currentPhase: FiscalPhaseId;
    }>>;
    listActivePeriods(): Promise<Array<{
        ruc: string;
        periodo: string;
    }>>;
}
//# sourceMappingURL=fiscal-phase-store.d.ts.map