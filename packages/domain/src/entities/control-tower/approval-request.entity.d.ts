import type { ApprovalDiffPayload, ApprovalStatus, AutonomyLevel, FiscalScope } from "../../drenyra/types";
import type { ApprovalRequestPrimitiveData, ApprovalRequestProps } from "./types";
export declare class ApprovalRequest {
    private props;
    private constructor();
    static create(props: ApprovalRequestProps): ApprovalRequest;
    static fromPrimitives(data: ApprovalRequestPrimitiveData): ApprovalRequest;
    approve(decidedBy: string, reason?: string): ApprovalRequest;
    reject(decidedBy: string, reason: string): ApprovalRequest;
    equals(other: ApprovalRequest | null | undefined): boolean;
    isDecided(): boolean;
    get id(): string;
    get caseId(): string;
    get scope(): FiscalScope;
    get status(): ApprovalStatus;
    get title(): string;
    get description(): string;
    get autonomyLevel(): AutonomyLevel;
    get requestedBy(): string;
    get requestedAt(): Date;
    get decidedBy(): string | undefined;
    get decidedAt(): Date | undefined;
    get decisionReason(): string | undefined;
    get diff(): ApprovalDiffPayload;
    get metadata(): Record<string, unknown>;
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=approval-request.entity.d.ts.map