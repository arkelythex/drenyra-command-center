import type { Actor, FiscalScope, Timestamp } from "./types";
import type { ToolRiskLevel } from "./tool-contract";
export declare const APPROVAL_STATUS: {
    readonly PENDING: "pending";
    readonly APPROVED: "approved";
    readonly REJECTED: "rejected";
    readonly CANCELLED: "cancelled";
    readonly EXPIRED: "expired";
};
export type ApprovalStatus = (typeof APPROVAL_STATUS)[keyof typeof APPROVAL_STATUS];
export type PolicyRuleType = "role" | "user" | "group" | "risk_based" | "dual";
export interface ApprovalPolicy {
    id: string;
    name: string;
    description: string;
    minRiskLevel: ToolRiskLevel;
    maxAmount: number;
    currency?: string;
    requiredRoles: string[];
    requiredUsers?: string[];
    requiresDualApproval: boolean;
    organizationId: string;
    active: boolean;
}
export interface ApprovalStep {
    id: string;
    order: number;
    label: string;
    status: ApprovalStatus;
    assignedTo: Actor[];
    approvedBy?: Actor;
    rejectedBy?: Actor;
    rejectionReason?: string;
    approvedAt?: Timestamp;
    rejectedAt?: Timestamp;
    policyId?: string;
}
export interface ApprovalRequestProps {
    id: string;
    title: string;
    description: string;
    action: string;
    riskLevel: ToolRiskLevel;
    candidateInput: unknown;
    expectedOutput?: unknown;
    scope: FiscalScope;
    requestedBy: Actor;
    status: ApprovalStatus;
    steps: ApprovalStep[];
    evidenceRootId?: string;
    traceId: string;
    amount?: number;
    currency?: string;
    deadline?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    resolvedAt?: Timestamp;
    expired: boolean;
    tags?: string[];
    metadata?: Record<string, unknown>;
}
export declare class ApprovalRequest {
    private readonly props;
    private constructor();
    static create(input: {
        title: string;
        description: string;
        action: string;
        riskLevel: ToolRiskLevel;
        candidateInput: unknown;
        expectedOutput?: unknown;
        scope: FiscalScope;
        requestedBy: Actor;
        assignedTo: Actor[];
        traceId: string;
        amount?: number;
        currency?: string;
        deadline?: Timestamp;
        evidenceRootId?: string;
        tags?: string[];
        metadata?: Record<string, unknown>;
    }): ApprovalRequest;
    static fromProps(props: ApprovalRequestProps): ApprovalRequest;
    get id(): string;
    get title(): string;
    get action(): string;
    get riskLevel(): ToolRiskLevel;
    get status(): ApprovalStatus;
    get steps(): ApprovalStep[];
    get requestedBy(): Actor;
    get scope(): FiscalScope;
    get amount(): number | undefined;
    get isResolved(): boolean;
    get currentStep(): ApprovalStep | undefined;
    get allStepsResolved(): boolean;
    approve(actor: Actor, stepId?: string): ApprovalRequest;
    reject(actor: Actor, reason: string, stepId?: string): ApprovalRequest;
    cancel(actor: Actor): ApprovalRequest;
    expire(): ApprovalRequest;
    toProps(): ApprovalRequestProps;
}
export declare function evaluatePolicies(policies: ApprovalPolicy[], action: {
    riskLevel: ToolRiskLevel;
    amount?: number;
    currency?: string;
    organizationId: string;
}): ApprovalPolicy[];
export interface ApprovalStore {
    create(request: ApprovalRequest): Promise<void>;
    get(id: string): Promise<ApprovalRequest | null>;
    update(request: ApprovalRequest): Promise<void>;
    list(filter: ApprovalFilter): Promise<ApprovalRequest[]>;
    listPendingFor(actorId: string): Promise<ApprovalRequest[]>;
}
export interface ApprovalFilter {
    status?: ApprovalStatus;
    organizationId?: string;
    companyId?: string;
    requestedBy?: string;
    riskLevel?: ToolRiskLevel;
    limit?: number;
    offset?: number;
}
export declare const DRENYRA_DEFAULT_POLICIES: ApprovalPolicy[];
//# sourceMappingURL=approval.d.ts.map