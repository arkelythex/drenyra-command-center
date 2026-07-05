export interface AuditEvent {
    agent: string;
    time: string;
    description: string;
    type?: "decision" | "action" | "validation";
    impact?: string;
    rule?: string;
}
export interface LedgerEntry {
    account: string;
    debit: number;
    credit: number;
}
export interface ComparisonScenario {
    name: string;
    metrics: Array<{
        label: string;
        value: string;
        highlight?: boolean;
        delta?: number;
    }>;
    recommended?: boolean;
}
export interface SearchResult {
    source: string;
    relevance: number;
    snippet: string;
}
export interface GapItem {
    label: string;
    value: number;
}
export interface BillsPayableRow {
    id: string;
    vendor: string;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    amount: number;
    remainingBalance: number;
    currency: string;
    status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "APPROVAL" | "REVIEW";
    daysOverdue?: number;
}
export interface CashflowProjectionPoint {
    period: string;
    inflow: number;
    outflow: number;
    balance: number;
}
export interface TaxSummaryRow {
    taxName: string;
    base: number;
    rate: string;
    amount: number;
    status: "CALCULATED" | "FILED" | "PENDING" | "OVERDUE";
    dueDate: string;
}
export interface PayrollEmployeeRow {
    employeeId: string;
    name: string;
    position: string;
    baseSalary: number;
    netSalary: number;
    deductions: number;
    bonus?: number;
    status: "PAID" | "PENDING" | "PROCESSING";
}
export interface BankingReconciliationRow {
    id: string;
    bankRef: string;
    description: string;
    bankAmount: number;
    ledgerAmount: number;
    difference: number;
    status: "MATCH" | "MISMATCH" | "MISSING_IN_LEDGER" | "MISSING_IN_BANK";
    date: string;
}
export interface AccountingDiffItem {
    field: string;
    before: string;
    after: string;
    reason?: string;
}
export interface SheetDiffRow {
    id: string;
    record: string;
    original: string;
    corrected: string;
    status: "updated" | "unchanged" | "flagged";
    reason?: string;
}
export type BaseArtifact = {
    id: string;
    title: string;
};
export type HubArtifact = (BaseArtifact & {
    type: "explanation";
    content: string;
    metadata?: Record<string, string>;
}) | (BaseArtifact & {
    type: "chart";
    payload: {
        data: number[];
        labels?: string[];
    };
}) | (BaseArtifact & {
    type: "table";
    payload: {
        events: AuditEvent[];
    };
}) | (BaseArtifact & {
    type: "action_card";
    payload: {
        message?: string;
    };
}) | (BaseArtifact & {
    type: "simulation";
    payload: {
        entries: LedgerEntry[];
    };
}) | (BaseArtifact & {
    type: "comparison";
    payload: {
        scenarios: ComparisonScenario[];
    };
}) | (BaseArtifact & {
    type: "accounting_diff";
    payload: {
        command: string;
        scope: string;
        diffs: AccountingDiffItem[];
        summary?: string;
    };
}) | (BaseArtifact & {
    type: "sheet_diff";
    payload: {
        command: string;
        sourceName: string;
        acceptShortcut: string;
        rows: SheetDiffRow[];
        summary: {
            total: number;
            updated: number;
            flagged: number;
        };
    };
}) | (BaseArtifact & {
    type: "search_result";
    payload: {
        results: SearchResult[];
    };
}) | (BaseArtifact & {
    type: "report";
    payload: {
        ruleSource?: string;
    };
}) | (BaseArtifact & {
    type: "knowledge_graph";
    payload: {
        linkCount?: number;
        confidence?: number;
    };
}) | (BaseArtifact & {
    type: "dashboard";
    payload: {
        primaryMetric: {
            value: string;
            trend: string;
        };
        statusScore: number;
        gapAnalysis?: GapItem[];
        ruleSource?: string;
    };
}) | (BaseArtifact & {
    type: "banking_reconciliation";
    payload: {
        period: string;
        accountId: string;
        accountName: string;
        currency: string;
        rows: BankingReconciliationRow[];
        summary: {
            totalBank: number;
            totalLedger: number;
            totalDifference: number;
            matched: number;
            mismatched: number;
        };
    };
}) | (BaseArtifact & {
    type: "bills_payable";
    payload: {
        rows: BillsPayableRow[];
        summary: {
            totalPending: number;
            totalOverdue: number;
            totalPaid: number;
            count: number;
        };
    };
}) | (BaseArtifact & {
    type: "cashflow_projection";
    payload: {
        projections: CashflowProjectionPoint[];
        currentBalance: number;
        currency: string;
    };
}) | (BaseArtifact & {
    type: "tax_summary";
    payload: {
        period: string;
        rows: TaxSummaryRow[];
        summary: {
            totalPayable: number;
            totalFiled: number;
            totalOverdue: number;
        };
    };
}) | (BaseArtifact & {
    type: "payroll_summary";
    payload: {
        period: string;
        employees: PayrollEmployeeRow[];
        summary: {
            totalSalaries: number;
            totalDeductions: number;
            totalNetPay: number;
            employeeCount: number;
            processedCount: number;
        };
    };
});
export type ArtifactType = HubArtifact["type"];
//# sourceMappingURL=types.d.ts.map