import type { AnomalyStrategy } from "./types";
export interface DuplicateInvoiceCheck {
    id: string;
    serie: string;
    numero: string;
    total: number;
    emisorRuc: string;
    emisionDate: string;
    tipoNota?: string;
    moneda?: string;
}
export declare function createDuplicateInvoiceStrategy(): AnomalyStrategy;
//# sourceMappingURL=duplicate-invoice.strategy.d.ts.map