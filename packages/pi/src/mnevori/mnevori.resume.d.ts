import type { FiscalPhaseStore } from "../phase/fiscal-phase-store";
import type { MnevoriResumePoint } from "./types";
import type { Mnevori } from "../mnevori";
export declare class MnevoriResumeService {
    private readonly mnevori;
    private readonly store;
    constructor(mnevori: Mnevori, store: FiscalPhaseStore);
    findInterruptedPeriods(): Promise<MnevoriResumePoint[]>;
    getPhaseToResume(point: MnevoriResumePoint): string | null;
}
//# sourceMappingURL=mnevori.resume.d.ts.map