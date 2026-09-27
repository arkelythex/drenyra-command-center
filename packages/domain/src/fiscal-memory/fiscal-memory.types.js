export const FISCAL_MEMORY_CATEGORIES = [
    "accounting_criterion",
    "tax_decision",
    "audit_finding",
    "monthly_closing",
    "evidence_note",
    "risk_exception",
    "client_explanation",
    "recurring_error",
];
export const FISCAL_MEMORY_SEVERITIES = [
    "info",
    "low",
    "medium",
    "high",
    "critical",
];
export const FISCAL_MEMORY_STATUSES = [
    "active",
    "resolved",
    "superseded",
    "archived",
];
export const FISCAL_MEMORY_EVIDENCE_REQUIRED_CATEGORIES = new Set([
    "tax_decision",
    "audit_finding",
    "risk_exception",
    "monthly_closing",
]);
export const FISCAL_MEMORY_ERROR_CODES = {
    INVALID_SCOPE: "FISCAL_MEMORY_INVALID_SCOPE",
    INVALID_RUC: "FISCAL_MEMORY_INVALID_RUC",
    INVALID_PERIOD: "FISCAL_MEMORY_INVALID_PERIOD",
    INVALID_CATEGORY: "FISCAL_MEMORY_INVALID_CATEGORY",
    INVALID_SEVERITY: "FISCAL_MEMORY_INVALID_SEVERITY",
    INVALID_STATUS: "FISCAL_MEMORY_INVALID_STATUS",
    EMPTY_TITLE: "FISCAL_MEMORY_EMPTY_TITLE",
    EMPTY_SUMMARY: "FISCAL_MEMORY_EMPTY_SUMMARY",
    EVIDENCE_REQUIRED: "FISCAL_MEMORY_EVIDENCE_REQUIRED",
};
//# sourceMappingURL=fiscal-memory.types.js.map