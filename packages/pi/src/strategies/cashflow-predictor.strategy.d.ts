import type { AnomalyStrategy } from "./types";
export declare const DEFAULT_ZSCORE_THRESHOLD = 2;
export declare const ROLLING_WINDOW_DAYS = 7;
export declare const INCOME_DROP_RATIO = 0.7;
export declare const EXPENSE_SPIKE_RATIO = 1.5;
export declare const MIN_DATA_POINTS = 7;
export declare const TREND_WINDOW_DAYS = 14;
export interface CashflowTransaction {
    id: string;
    date: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    category: string;
    description?: string;
}
export interface CashflowPredictorOptions {
    zscoreThreshold?: number;
    rollingWindowDays?: number;
    incomeDropRatio?: number;
    expenseSpikeRatio?: number;
    detectTrendReversal?: boolean;
}
export declare function createCashflowPredictorStrategy(options?: CashflowPredictorOptions): AnomalyStrategy;
//# sourceMappingURL=cashflow-predictor.strategy.d.ts.map