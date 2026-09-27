import type { DiffChange } from "./diff-change";
import type { DiffStatus } from "./diff-status";
import type { DiffType } from "./diff-type";
import type { DiffId, DiffImpact } from "./index";
export interface AccountingDiffProps {
    id: DiffId;
    threadId: string;
    type: DiffType;
    title: string;
    description: string;
    changes: DiffChange[];
    impact: DiffImpact;
    createdBy: string;
    evidenceIds: string[];
    reviewerId?: string;
    rejectionReason?: string;
    pendingQuestion?: string;
}
export declare class AccountingDiff {
    readonly id: DiffId;
    readonly threadId: string;
    readonly type: DiffType;
    readonly title: string;
    readonly description: string;
    readonly changes: readonly DiffChange[];
    readonly impact: DiffImpact;
    readonly status: DiffStatus;
    readonly createdBy: string;
    readonly evidenceIds: readonly string[];
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly reviewerId?: string | undefined;
    readonly rejectionReason?: string | undefined;
    readonly pendingQuestion?: string | undefined;
    private constructor();
    static create(props: AccountingDiffProps): AccountingDiff;
    approve(reviewerId: string): AccountingDiff;
    reject(reviewerId: string, reason: string): AccountingDiff;
    requestInfo(question: string): AccountingDiff;
    canTransitionTo(target: DiffStatus): boolean;
    private assertStatus;
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=accounting-diff.d.ts.map