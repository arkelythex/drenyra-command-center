/**
 * Tenants fixtures — deterministas, inmutables, reutilizables.
 *
 * Proporciona pares preparados para:
 *   - misma identidad en la misma compañía
 *   - misma identidad entre compañías
 *   - misma identidad entre organizaciones
 */

// Deterministic UUIDs for testing (v4 format with fixed hex)
export interface TenantScope {
	organizationId: string;
	companyId: string;
}

export interface TenantsFixture {
	tenantA: TenantScope;
	tenantB: TenantScope; // Different company, same org
	tenantC: TenantScope; // Different org, same company-ish
}

export function createTenantFixture(
	overrides?: Partial<TenantsFixture>,
): TenantsFixture {
	const base: TenantsFixture = {
		tenantA: {
			organizationId: "00000000-0000-4000-a000-000000000001",
			companyId: "00000000-0000-4000-a000-000000000010",
		},
		tenantB: {
			organizationId: "00000000-0000-4000-a000-000000000001",
			companyId: "00000000-0000-4000-a000-000000000020",
		},
		tenantC: {
			organizationId: "00000000-0000-4000-b000-000000000001",
			companyId: "00000000-0000-4000-b000-000000000010",
		},
	};
	return { ...base, ...overrides };
}
