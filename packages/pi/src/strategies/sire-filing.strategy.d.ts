import type { AnomalyStrategy } from "./types";
export declare const SIRE_DEADLINE_DAYS = 7;
export declare const CRITICAL_OVERDUE_DAYS = 30;
export declare const CDR_CONFIRMED_BOOST = 0.05;
export interface SireFilingRecord {
    id: string;
    serie: string;
    numero: string;
    tipoDocumento: string;
    emisorRuc: string;
    receptorRuc?: string;
    emisionDate: string;
    filingDate: string | null;
    total: number;
    cdrReceived: boolean;
    cdrDate?: string | null;
}
export declare function createSireFilingStrategy(options?: {
    deadlineDays?: number;
    criticalOverdueDays?: number;
}): AnomalyStrategy;
//# sourceMappingURL=sire-filing.strategy.d.ts.map