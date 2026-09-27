export type FiscalMemoryCategory = "accounting_criterion" | "tax_decision" | "audit_finding" | "monthly_closing" | "evidence_note" | "risk_exception" | "client_explanation" | "recurring_error";
export type FiscalMemorySeverity = "info" | "low" | "medium" | "high" | "critical";
export type FiscalMemoryStatus = "active" | "resolved" | "superseded" | "archived";
export declare const FISCAL_MEMORY_CATEGORIES: readonly FiscalMemoryCategory[];
export declare const FISCAL_MEMORY_SEVERITIES: readonly FiscalMemorySeverity[];
export declare const FISCAL_MEMORY_STATUSES: readonly FiscalMemoryStatus[];
export declare const FISCAL_MEMORY_EVIDENCE_REQUIRED_CATEGORIES: Set<FiscalMemoryCategory>;
export declare const FISCAL_MEMORY_ERROR_CODES: {
    readonly INVALID_SCOPE: "FISCAL_MEMORY_INVALID_SCOPE";
    readonly INVALID_RUC: "FISCAL_MEMORY_INVALID_RUC";
    readonly INVALID_PERIOD: "FISCAL_MEMORY_INVALID_PERIOD";
    readonly INVALID_CATEGORY: "FISCAL_MEMORY_INVALID_CATEGORY";
    readonly INVALID_SEVERITY: "FISCAL_MEMORY_INVALID_SEVERITY";
    readonly INVALID_STATUS: "FISCAL_MEMORY_INVALID_STATUS";
    readonly EMPTY_TITLE: "FISCAL_MEMORY_EMPTY_TITLE";
    readonly EMPTY_SUMMARY: "FISCAL_MEMORY_EMPTY_SUMMARY";
    readonly EVIDENCE_REQUIRED: "FISCAL_MEMORY_EVIDENCE_REQUIRED";
};
export type FiscalMemoryErrorCode = (typeof FISCAL_MEMORY_ERROR_CODES)[keyof typeof FISCAL_MEMORY_ERROR_CODES];
export interface FiscalMemoryScope {
    readonly tenantId: string;
    readonly companyId: string;
    readonly ruc: string;
}
export interface FiscalMemoryProps extends FiscalMemoryScope {
    readonly id: string;
    readonly period: string;
    readonly category: FiscalMemoryCategory;
    readonly severity: FiscalMemorySeverity;
    readonly status: FiscalMemoryStatus;
    readonly title: string;
    readonly summary: string;
    readonly evidenceRefs: readonly string[];
    readonly tags: readonly string[];
    readonly createdBy: string;
    readonly approvedBy?: string;
    readonly sourceAgentId?: string;
    readonly relatedMemoryIds?: readonly string[];
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export interface FiscalMemoryRevisionProps {
    readonly id: string;
    readonly memoryId: string;
    readonly revisionNumber: number;
    readonly changedBy: string;
    readonly changeReason: string;
    readonly previousValue: FiscalMemoryProps;
    readonly nextValue: FiscalMemoryProps;
    readonly createdAt: Date;
}
//# sourceMappingURL=fiscal-memory.types.d.ts.map