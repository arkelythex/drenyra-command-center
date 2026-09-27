import type { AnomalyStrategy } from "./types";
export declare const CONCENTRATION_THRESHOLD_PCT = 50;
export declare const PAYMENT_DELAY_DAYS_THRESHOLD = 15;
export declare const NEW_SUPPLIER_HIGH_VALUE_THRESHOLD = 10000;
export declare const DEBT_AGING_BUCKETS: readonly [30, 60, 90];
export declare const NEW_SUPPLIER_LOOKBACK_DAYS = 90;
export interface SupplierRecord {
    id: string;
    name: string;
    ruc: string;
    bankAccount?: string;
    createdAt: string;
}
export interface TransactionRecord {
    id: string;
    supplierId: string;
    supplierName: string;
    supplierRuc: string;
    documentType: string;
    serie: string;
    numero: string;
    amount: number;
    currency: string;
    issueDate: string;
    dueDate: string;
    paymentDate: string | null;
    paid: boolean;
}
export interface SupplierIntelligenceInput {
    suppliers: SupplierRecord[];
    transactions: TransactionRecord[];
}
export declare function createSupplierIntelligenceStrategy(options?: {
    concentrationThresholdPct?: number;
    paymentDelayDaysThreshold?: number;
    newSupplierHighValueThreshold?: number;
    newSupplierLookbackDays?: number;
}): AnomalyStrategy;
//# sourceMappingURL=supplier-intelligence.strategy.d.ts.map