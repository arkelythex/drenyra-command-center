import type { FiscalPhaseStore } from "../phase/fiscal-phase-store";
import type { FiscalPhaseId } from "../phase/types";
import type { MnevoriArtifact, MnevoriPhaseSnapshot, MnevoriResumePoint } from "./types";
export declare class Mnevori {
    private readonly store;
    constructor(store: FiscalPhaseStore);
    persistArtifact(artifact: Omit<MnevoriArtifact, "id" | "persistedAt">): Promise<string>;
    persistPhaseSnapshot(ruc: string, periodo: string, phaseId: FiscalPhaseId, snapshot: Omit<MnevoriPhaseSnapshot, "ruc" | "periodo" | "phaseId" | "persistedAt">): Promise<string>;
    getResumePoint(ruc: string, periodo: string): Promise<MnevoriResumePoint | null>;
    listPhaseSnapshots(ruc: string, periodo: string): Promise<MnevoriArtifact[]>;
    getRegulationVersion(): string;
    isRegulationCurrent(phaseVersion: string): boolean;
}
//# sourceMappingURL=mnevori.d.ts.map