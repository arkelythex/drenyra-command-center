import type { AutonomyLevel, FiscalCaseStatus, FiscalCaseType, FiscalRiskLevel, FiscalScope } from "../../drenyra/types";
import type { FiscalCasePrimitiveData, FiscalCaseProps } from "./types";
export declare class FiscalCase {
    private props;
    private constructor();
    static create(props: FiscalCaseProps): FiscalCase;
    static fromPrimitives(data: FiscalCasePrimitiveData): FiscalCase;
    private transition;
    startReview(): FiscalCase;
    requestApproval(): FiscalCase;
    resolve(): FiscalCase;
    archive(): FiscalCase;
    updateRisk(riskLevel: FiscalRiskLevel, riskScore: number): FiscalCase;
    updateMetadata(metadata: Record<string, unknown>): FiscalCase;
    equals(other: FiscalCase | null | undefined): boolean;
    get id(): string;
    get scope(): FiscalScope;
    get type(): FiscalCaseType;
    get status(): FiscalCaseStatus;
    get title(): string;
    get description(): string;
    get riskLevel(): FiscalRiskLevel;
    get riskScore(): number;
    get autonomyLevel(): AutonomyLevel;
    get createdBy(): string;
    get createdAt(): Date;
    get updatedAt(): Date;
    get metadata(): Record<string, unknown>;
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=fiscal-case.entity.d.ts.map