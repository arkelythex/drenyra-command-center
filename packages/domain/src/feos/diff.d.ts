import type { Actor, FiscalScope, Timestamp } from "./types";
import type { EvidenceItem } from "./evidence-root";
export type DiffCategory = "journal_entry" | "invoice" | "reconciliation" | "sire_filing" | "account_balance" | "tax_calculation" | "configuration" | "other";
export type DiffSeverity = "critical" | "high" | "medium" | "low";
export type DiffStatus = "draft" | "ready_for_review" | "under_review" | "approved" | "rejected" | "applied" | "cancelled";
export interface FinancialImpact {
    netAmount: number;
    currency: string;
    totalDebit: number;
    totalCredit: number;
    affectsFiscalReporting: boolean;
    affectsCashFlow: boolean;
    affectsPeriodClose: boolean;
    affectedAccounts: string[];
    impactPercentage?: number;
    summary: string;
}
export interface DiffChange {
    id: string;
    field: string;
    before: unknown;
    after: unknown;
    label: string;
    amount?: number;
    fiscalImpact: boolean;
}
export interface DiffReview {
    reviewedBy: Actor;
    reviewedAt: Timestamp;
    decision: "approved" | "rejected" | "changes_requested";
    comments: string;
    approvalRequestId?: string;
}
export interface FinancialDiffProps {
    id: string;
    title: string;
    description: string;
    category: DiffCategory;
    severity: DiffSeverity;
    status: DiffStatus;
    beforeState: unknown;
    afterState: unknown;
    changes: DiffChange[];
    impact: FinancialImpact;
    evidence: EvidenceItem[];
    reviews: DiffReview[];
    approvalRequestId?: string;
    scope: FiscalScope;
    createdBy: Actor;
    workspaceId?: string;
    traceId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    appliedAt?: Timestamp;
    tags?: string[];
    metadata?: Record<string, unknown>;
}
export declare class FinancialDiff {
    private readonly props;
    private constructor();
    static create(input: {
        title: string;
        description: string;
        category: DiffCategory;
        beforeState: unknown;
        afterState: unknown;
        changes: DiffChange[];
        impact: FinancialImpact;
        scope: FiscalScope;
        createdBy: Actor;
        workspaceId?: string;
        traceId: string;
        evidence?: EvidenceItem[];
        tags?: string[];
        metadata?: Record<string, unknown>;
    }): FinancialDiff;
    static fromProps(props: FinancialDiffProps): FinancialDiff;
    get id(): string;
    get title(): string;
    get status(): DiffStatus;
    get severity(): DiffSeverity;
    get impact(): FinancialImpact;
    get changes(): DiffChange[];
    get evidence(): EvidenceItem[];
    get reviews(): DiffReview[];
    get scope(): FiscalScope;
    get approvalRequestId(): string | undefined;
    get isResolved(): boolean;
    toProps(): FinancialDiffProps;
    private transition;
    submitForReview(): FinancialDiff;
    startReview(): FinancialDiff;
    approve(review: DiffReview): FinancialDiff;
    reject(review: DiffReview): FinancialDiff;
    markApplied(): FinancialDiff;
    cancel(): FinancialDiff;
    linkApproval(approvalRequestId: string): FinancialDiff;
    addEvidence(item: EvidenceItem): FinancialDiff;
}
export declare function isValidDiffTransition(from: DiffStatus, to: DiffStatus): boolean;
export declare function computeSeverity(impact: FinancialImpact): DiffSeverity;
export interface DiffRiskScore {
    overall: "low" | "medium" | "high" | "critical";
    factors: DiffRiskFactor[];
}
export interface DiffRiskFactor {
    name: string;
    score: number;
    description: string;
}
export declare function computeDiffRiskScore(diff: FinancialDiffProps | FinancialDiff): DiffRiskScore;
export interface FinancialDiffStore {
    store(diff: FinancialDiff): Promise<void>;
    get(id: string): Promise<FinancialDiff | null>;
    list(filter: DiffFilter): Promise<FinancialDiff[]>;
    listPending(): Promise<FinancialDiff[]>;
}
export interface DiffFilter {
    status?: DiffStatus;
    severity?: DiffSeverity;
    category?: DiffCategory;
    organizationId?: string;
    companyId?: string;
    workspaceId?: string;
    limit?: number;
    offset?: number;
}
//# sourceMappingURL=diff.d.ts.map