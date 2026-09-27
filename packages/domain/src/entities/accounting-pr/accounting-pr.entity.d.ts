import type { AccountingPrProps, AccountingPrStatus, PrSignature } from "./types";
export type { AccountingPrProps, AccountingPrStatus, PrSignature, } from "./types";
export declare class AccountingPr {
    private props;
    private constructor();
    static create(props: AccountingPrProps): AccountingPr;
    static fromPrimitives(data: Record<string, unknown>): AccountingPr;
    submitForReview(reviewerId?: string): AccountingPr;
    approve(signerId: string, comment?: string): AccountingPr;
    reject(reason: string): AccountingPr;
    post(): AccountingPr;
    addSignature(signerId: string, comment?: string): AccountingPr;
    canBeModified(): boolean;
    equals(other: AccountingPr | null | undefined): boolean;
    get id(): string;
    get companyId(): string;
    get prNumber(): number;
    get title(): string;
    get description(): string | undefined;
    get status(): AccountingPrStatus;
    get entries(): readonly string[];
    get evidenceIds(): readonly string[];
    get totalDebitCents(): number;
    get totalCreditCents(): number;
    get reviewerId(): string | undefined;
    get reviewedAt(): Date | undefined;
    get reviewComment(): string | undefined;
    get approveSignerIds(): readonly string[];
    get approveSignatures(): readonly PrSignature[];
    get createdById(): string | undefined;
    get createdAt(): Date;
    get updatedAt(): Date;
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=accounting-pr.entity.d.ts.map