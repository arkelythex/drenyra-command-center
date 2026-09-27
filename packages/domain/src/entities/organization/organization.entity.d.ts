import type { FirmMetrics, OrganizationPrimitiveData, OrganizationProps, OrganizationSettings, OrganizationStatus } from "./types";
export declare class Organization {
    private props;
    private constructor();
    static create(props: OrganizationProps): Organization;
    static fromPrimitives(plainData: OrganizationPrimitiveData): Organization;
    suspend(reason?: string): Organization;
    reactivate(): Organization;
    updateSettings(settings: OrganizationSettings): Organization;
    updateHealthScore(score: number): Organization;
    equals(other: Organization | null | undefined): boolean;
    get id(): string;
    get name(): string;
    get ruc(): string;
    get slug(): string;
    get settings(): OrganizationSettings | undefined;
    get status(): OrganizationStatus;
    get healthScore(): number | undefined;
    get metrics(): FirmMetrics | undefined;
    get createdAt(): Date;
    get updatedAt(): Date;
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=organization.entity.d.ts.map