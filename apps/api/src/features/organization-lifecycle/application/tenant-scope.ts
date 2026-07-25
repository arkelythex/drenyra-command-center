import type { Organization } from "@drenyra/domain";

export function assertTenantScope(org: Organization, tenantId: string): void {
	const settings = org.settings as Record<string, unknown> | undefined;
	if (settings?._tenantFirmId !== tenantId) {
		throw new Error("Organization does not belong to the firm's tenant scope");
	}
}
