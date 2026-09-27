import { DomainEvent } from "../../events";
import type { Money } from "../../value-objects";
export type CaseStatus = "open" | "active" | "resolved" | "closed";
export type CaseIdentity = string & {
    readonly __brand: "CaseId";
};
export declare function CaseId(id: string): CaseIdentity;
export declare class Case {
    readonly id: CaseIdentity;
    readonly companyId: string;
    readonly status: CaseStatus;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    private readonly projections;
    private constructor();
    static create(params: {
        companyId: string;
    }): Case;
    getProjection<T extends CaseProjection>(domain: DomainKey): T | undefined;
    attachProjection(domain: DomainKey, projection: CaseProjection, owner: DomainKey): Case;
    getAllProjections(): ReadonlyMap<string, CaseProjection>;
    getAttachedDomains(): DomainKey[];
    activate(): Case;
    resolve(): Case;
    close(): Case;
    static projectionAttached(caseId: CaseIdentity, domain: DomainKey): CaseProjectionAttached;
}
export type DomainKey = "fiscal" | "legal" | "clinical" | "creative" | "operational" | "financial" | "technical" | "government" | string;
export interface CaseProjection {
    readonly domain: DomainKey;
    readonly updatedAt: Date;
    readonly metadata: ProjectionMetadata;
}
export interface ProjectionMetadata {
    readonly summary: string;
    readonly priority: "low" | "medium" | "high" | "critical";
    readonly assignedTo?: string;
    readonly dueDate?: Date;
    readonly tags: readonly string[];
}
export declare class CaseProjectionAttached extends DomainEvent {
    readonly caseId: CaseIdentity;
    readonly domain: DomainKey;
    get eventName(): string;
    constructor(caseId: CaseIdentity, domain: DomainKey);
    protected getPayload(): Record<string, unknown>;
}
export declare class CaseProjectionUpdated extends DomainEvent {
    readonly caseId: CaseIdentity;
    readonly domain: DomainKey;
    readonly changedFields: readonly string[];
    get eventName(): string;
    constructor(caseId: CaseIdentity, domain: DomainKey, changedFields: readonly string[]);
    protected getPayload(): Record<string, unknown>;
}
export declare class CaseCrossDomainQuery extends DomainEvent {
    readonly caseId: CaseIdentity;
    readonly sourceDomain: DomainKey;
    readonly targetDomain: DomainKey;
    readonly queryType: string;
    readonly queryPayload: Record<string, unknown>;
    get eventName(): string;
    constructor(caseId: CaseIdentity, sourceDomain: DomainKey, targetDomain: DomainKey, queryType: string, queryPayload: Record<string, unknown>);
    protected getPayload(): Record<string, unknown>;
}
export interface FiscalProjection extends CaseProjection {
    readonly domain: "fiscal";
    readonly ruc: string;
    readonly period: string;
    readonly totalIncome: Money;
    readonly totalTax: Money;
    readonly status: "pending" | "filed" | "audited";
    readonly sunatSubmissionId?: string;
}
export interface LegalProjection extends CaseProjection {
    readonly domain: "legal";
    readonly matterType: string;
    readonly clientId: string;
    readonly opposingParty?: string;
    readonly deadlines: readonly Date[];
    readonly status: "research" | "active_litigation" | "settled";
}
export interface ClinicalProjection extends CaseProjection {
    readonly domain: "clinical";
    readonly patientId: string;
    readonly diagnosisCode: string;
    readonly treatmentPlan: string;
    readonly status: "diagnosis" | "treatment" | "follow_up";
}
export interface CaseRepository {
    findById(id: CaseIdentity): Promise<Case | null>;
    findByCompany(companyId: string): Promise<Case[]>;
    findByDomain(domain: DomainKey): Promise<Case[]>;
    findByStatus(status: CaseStatus): Promise<Case[]>;
    save(caseEntity: Case): Promise<void>;
    delete(id: CaseIdentity): Promise<void>;
}
export interface CrossDomainQuery<TRequest, TResponse> {
    readonly sourceDomain: DomainKey;
    readonly targetDomain: DomainKey;
    readonly queryType: string;
    validateRequest(request: TRequest): boolean;
    processQuery(request: TRequest, caseEntity: Case): Promise<CrossDomainResponse<TResponse>>;
}
export type CrossDomainResponse<T> = {
    success: true;
    data: T;
} | {
    success: false;
    reason: string;
};
//# sourceMappingURL=case.d.ts.map