import type { Actor, FiscalScope, Timestamp } from "./types";
export declare const CHANGE_SET_STATUS: {
    readonly DRAFT: "draft";
    readonly PROPOSED: "proposed";
    readonly UNDER_REVIEW: "under_review";
    readonly APPROVED: "approved";
    readonly APPLIED: "applied";
    readonly REJECTED: "rejected";
    readonly ROLLED_BACK: "rolled_back";
    readonly CANCELLED: "cancelled";
};
export type ChangeSetStatus = (typeof CHANGE_SET_STATUS)[keyof typeof CHANGE_SET_STATUS];
export type ChangeEntryType = "journal_entry" | "invoice_adjustment" | "document_attachment" | "sire_adjustment" | "account_configuration" | "reconciliation";
export interface ChangeEntry {
    id: string;
    type: ChangeEntryType;
    description: string;
    beforeState: unknown;
    afterState: unknown;
    fiscalImpact: boolean;
    amount?: number;
    currency?: string;
}
export interface ChangeSetProps {
    id: string;
    title: string;
    description: string;
    workspaceId: string;
    status: ChangeSetStatus;
    entries: ChangeEntry[];
    parentId?: string;
    childIds: string[];
    evidenceRootId?: string;
    scope: FiscalScope;
    createdBy: Actor;
    traceId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    appliedAt?: Timestamp;
    rolledBackAt?: Timestamp;
    tags?: string[];
    metadata?: Record<string, unknown>;
}
export declare class ChangeSet {
    private readonly props;
    private constructor();
    static create(input: {
        title: string;
        description: string;
        workspaceId: string;
        scope: FiscalScope;
        createdBy: Actor;
        traceId: string;
        parentId?: string;
        entries?: ChangeEntry[];
        tags?: string[];
        metadata?: Record<string, unknown>;
    }): ChangeSet;
    static fromProps(props: ChangeSetProps): ChangeSet;
    get id(): string;
    get title(): string;
    get status(): ChangeSetStatus;
    get entries(): ChangeEntry[];
    get parentId(): string | undefined;
    get childIds(): string[];
    private transition;
    propose(): ChangeSet;
    submitForReview(): ChangeSet;
    approve(): ChangeSet;
    reject(): ChangeSet;
    apply(): ChangeSet;
    rollback(): ChangeSet;
    cancel(): ChangeSet;
    addEntry(entry: ChangeEntry): ChangeSet;
    fork(title: string, description: string, actor: Actor): ChangeSet;
    merge(child: ChangeSet): ChangeSet;
    linkEvidence(evidenceRootId: string): ChangeSet;
    toProps(): ChangeSetProps;
}
export declare function isValidCSTransition(from: ChangeSetStatus, to: ChangeSetStatus): boolean;
export interface ChangeSetStore {
    store(cs: ChangeSet): Promise<void>;
    get(id: string): Promise<ChangeSet | null>;
    list(filter?: {
        workspaceId?: string;
        status?: ChangeSetStatus;
    }): Promise<ChangeSet[]>;
}
//# sourceMappingURL=change-set.d.ts.map