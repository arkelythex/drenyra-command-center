import type { CompanyId, OrganizationId, PortfolioId, WorkspaceId, PeriodRef, Actor, FiscalScope, Timestamp } from "./types";
export declare const WORKSPACE_STATE: {
    readonly QUEUED: "queued";
    readonly WORKING: "working";
    readonly VERIFYING: "verifying";
    readonly WAITING_INPUT: "waiting-input";
    readonly WAITING_EVIDENCE: "waiting-evidence";
    readonly WAITING_APPROVAL: "waiting-approval";
    readonly BLOCKED: "blocked";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
    readonly UNKNOWN: "unknown";
};
export type WorkspaceState = (typeof WORKSPACE_STATE)[keyof typeof WORKSPACE_STATE];
export type WorkspaceStateGroup = "active" | "waiting" | "blocked" | "terminal" | "unknown";
export declare function getStateGroup(state: WorkspaceState): WorkspaceStateGroup;
export declare function isWorkspaceHealthy(state: WorkspaceState): boolean;
export declare function isWorkspaceTerminal(state: WorkspaceState): boolean;
export declare function isValidTransition(from: WorkspaceState, to: WorkspaceState): boolean;
export declare const WORKSPACE_INTENT: {
    readonly CLOSE: "close";
    readonly RECONCILE: "reconcile";
    readonly REVIEW: "review";
    readonly INVESTIGATE: "investigate";
    readonly CONFIGURE: "configure";
    readonly REPORT: "report";
    readonly AUDIT: "audit";
    readonly SUBMISSION: "submission";
};
export type WorkspaceIntent = (typeof WORKSPACE_INTENT)[keyof typeof WORKSPACE_INTENT];
export interface BlockingInfo {
    reason: string;
    blockedBy: WorkspaceId[];
    blockedSince: Timestamp;
    blockedByActor?: Actor;
    unblockInstructions?: string;
    unblockUrl?: string;
}
export interface WorkspaceProps {
    id: WorkspaceId;
    organizationId: OrganizationId;
    companyId: CompanyId;
    companyRuc: string;
    period: PeriodRef;
    intent: WorkspaceIntent;
    label: string;
    description?: string;
    state: WorkspaceState;
    blocking?: BlockingInfo;
    createdBy: Actor;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    completedAt?: Timestamp;
    metadata?: Record<string, unknown>;
}
export declare class Workspace {
    private readonly props;
    private constructor();
    static create(input: {
        organizationId: OrganizationId;
        companyId: CompanyId;
        companyRuc: string;
        period: PeriodRef;
        intent: WorkspaceIntent;
        label: string;
        description?: string;
        createdBy: Actor;
        metadata?: Record<string, unknown>;
    }): Workspace;
    static fromProps(props: WorkspaceProps): Workspace;
    get id(): WorkspaceId;
    get organizationId(): OrganizationId;
    get companyId(): CompanyId;
    get companyRuc(): string;
    get period(): PeriodRef;
    get intent(): WorkspaceIntent;
    get label(): string;
    get description(): string | undefined;
    get state(): WorkspaceState;
    get blocking(): BlockingInfo | undefined;
    get createdBy(): Actor;
    get createdAt(): Timestamp;
    get updatedAt(): Timestamp;
    get completedAt(): Timestamp | undefined;
    get metadata(): Record<string, unknown> | undefined;
    get scope(): FiscalScope;
    get stateGroup(): WorkspaceStateGroup;
    get isHealthy(): boolean;
    get isTerminal(): boolean;
    private transition;
    start(): Workspace;
    verify(): Workspace;
    markCompleted(): Workspace;
    markFailed(error?: string): Workspace;
    waitForInput(): Workspace;
    waitForEvidence(): Workspace;
    waitForApproval(): Workspace;
    block(reason: string, blockedBy: WorkspaceId[], actor?: Actor, instructions?: string): Workspace;
    unblock(actor?: Actor): Workspace;
    resolveFromUnknown(to: "queued" | "failed"): Workspace;
    markUnknown(reason: string): Workspace;
    toProps(): WorkspaceProps;
}
export interface PortfolioView {
    organizationId: OrganizationId;
    portfolioId: PortfolioId;
    companies: PortfolioCompanyView[];
    rollup: PortfolioRollup;
    lastUpdated: Timestamp;
}
export interface PortfolioCompanyView {
    companyId: CompanyId;
    companyRuc: string;
    companyName: string;
    workspaces: WorkspaceProps[];
    rollup: PortfolioRollup;
}
export interface PortfolioRollup {
    total: number;
    active: number;
    waiting: number;
    blocked: number;
    completed: number;
    failed: number;
    unknown: number;
    blockingPropagation?: WorkspaceId[];
}
export declare function computePortfolioRollup(workspaces: WorkspaceProps[]): PortfolioRollup;
//# sourceMappingURL=workspace.d.ts.map