import type { Organization } from "../entities/organization";
import type { FirmMetrics } from "../entities/organization/types";
import type { TenantScopedRepository } from "./tenant-scoped.repository";

export interface OrganizationFilters {
	status?: "ACTIVE" | "SUSPENDED" | "INACTIVE";
	search?: string;
	limit?: number;
	offset?: number;
}

export interface OrganizationRepository
	extends TenantScopedRepository<Organization, string, OrganizationFilters> {
	findByRuc(ruc: string): Promise<Organization | null>;
	findBySlug(slug: string): Promise<Organization | null>;
	findActive(): Promise<Organization[]>;
	getFirmMetrics(organizationId: string): Promise<FirmMetrics>;
}
