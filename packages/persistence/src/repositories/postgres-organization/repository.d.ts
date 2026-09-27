import type { FirmMetrics } from "@drenyra/domain/entities/organization";
import { Organization } from "@drenyra/domain/entities/organization";
import type { OrganizationFilters, OrganizationRepository } from "@drenyra/domain/repositories/organization.repository";
export declare class PostgresOrganizationRepository implements OrganizationRepository {
    findById(id: string): Promise<Organization | null>;
    findAll(filters?: OrganizationFilters): Promise<Organization[]>;
    count(filters?: OrganizationFilters): Promise<number>;
    save(entity: Organization): Promise<Organization>;
    update(entity: Organization): Promise<Organization>;
    delete(id: string): Promise<void>;
    saveForOrganization(entity: Organization, _organizationId: string): Promise<Organization>;
    findForOrganization(organizationId: string, filters?: OrganizationFilters): Promise<Organization[]>;
    countForOrganization(organizationId: string, filters?: OrganizationFilters): Promise<number>;
    deleteForOrganization(id: string, organizationId: string): Promise<void>;
    findByRuc(ruc: string): Promise<Organization | null>;
    findBySlug(slug: string): Promise<Organization | null>;
    findActive(): Promise<Organization[]>;
    getFirmMetrics(organizationId: string): Promise<FirmMetrics>;
    private buildFilterConditions;
    private mapRowToEntity;
    private mapEntityToRow;
}
//# sourceMappingURL=repository.d.ts.map