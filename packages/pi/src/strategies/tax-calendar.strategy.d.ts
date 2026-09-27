import type { AnomalySeverity, AnomalyStrategy } from "./types";
export declare const ALERT_DAYS: Record<AnomalySeverity, number>;
export interface TaxObligation {
    id: string;
    code: string;
    name: string;
    description: string;
    dueDate: string;
    status: "pending" | "filed" | "exempt";
    filingDate: string | null;
    amount?: number;
    period?: string;
    legalReference: string;
}
export interface TaxCalendarInput {
    tenantRuc: string;
    rucType: string;
    taxRegime: string;
    obligations: TaxObligation[];
}
export declare function createTaxCalendarStrategy(): AnomalyStrategy;
//# sourceMappingURL=tax-calendar.strategy.d.ts.map