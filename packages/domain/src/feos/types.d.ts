export type WorkspaceId = string & {
    readonly __brand: "WorkspaceId";
};
export type CompanyId = string & {
    readonly __brand: "CompanyId";
};
export type OrganizationId = string & {
    readonly __brand: "OrganizationId";
};
export type PortfolioId = string & {
    readonly __brand: "PortfolioId";
};
export type ChangeSetId = string & {
    readonly __brand: "ChangeSetId";
};
export type EvidenceRootId = string & {
    readonly __brand: "EvidenceRootId";
};
export type ReceiptId = string & {
    readonly __brand: "ReceiptId";
};
export type AttentionId = string & {
    readonly __brand: "AttentionId";
};
export type EventId = string & {
    readonly __brand: "EventId";
};
export interface FiscalScope {
    organizationId: OrganizationId;
    companyId: CompanyId;
    companyRuc: string;
    fiscalPeriod: string;
}
export interface OrganizationRef {
    id: OrganizationId;
    name: string;
    slug: string;
}
export interface PortfolioRef {
    id: PortfolioId;
    name: string;
    organizationId: OrganizationId;
}
export interface CompanyRef {
    id: CompanyId;
    name: string;
    ruc: string;
    organizationId: OrganizationId;
}
export interface PeriodRef {
    year: number;
    month: number;
    label: string;
}
export interface Timestamp {
    iso: string;
    unix: number;
}
export type ActorType = "user" | "agent" | "system" | "automation";
export interface Actor {
    id: string;
    type: ActorType;
    label: string;
}
export declare class FeosError extends Error {
    readonly code: string;
    readonly details?: Record<string, unknown>;
    constructor(code: string, message: string, details?: Record<string, unknown>);
}
export declare function generateId(): string;
export declare function nowISO(): string;
export declare function nowTimestamp(): Timestamp;
export declare function createPeriodRef(year: number, month: number): PeriodRef;
//# sourceMappingURL=types.d.ts.map