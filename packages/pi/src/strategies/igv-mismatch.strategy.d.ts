import type { AnomalyStrategy } from "./types";
export declare const IGV_RATE = 0.18;
export declare const IGV_TOLERANCE_PEN = 1;
export declare const EXONERATED_TIPOS: readonly string[];
export interface IgvMismatchInvoice {
    id: string;
    serie: string;
    numero: string;
    tipoOperacion: string;
    baseImponible: number;
    igvCalculado: number;
    emisorRuc: string;
    emisionDate: string;
}
export declare function createIgvMismatchStrategy(): AnomalyStrategy;
//# sourceMappingURL=igv-mismatch.strategy.d.ts.map