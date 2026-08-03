/**
 * CompanyScopeFiscalMemoryResolver — resolves a FiscalMemoryScope from an
 * authenticated company id, mirroring the recorder's convention (PR #152):
 * tenantId = organization tenant id (fallback "api"), companyId = ruc,
 * ruc = the company's 11-digit Peruvian RUC.
 *
 * Every fiscal-memory read is scoped by tenantId + companyId + ruc; the engram
 * scope is structural (exact match), so a different tenant/company/RUC can
 * never retrieve another tenant's memory.
 */

import type { FiscalMemoryScope } from "@drenyra/domain/fiscal-memory";
import {
	resolveCompanyRuc,
	tryResolveOrganizationIdFromCompany,
} from "@drenyra/persistence/repositories/support/organization-resolver";
import type { FiscalMemoryScopeResolver } from "./fiscal-memory.query";

/** Default resolver — company → { tenantId, companyId: ruc, ruc }. */
export const companyScopeFiscalMemoryResolver: FiscalMemoryScopeResolver = {
	async resolve(companyId: string): Promise<FiscalMemoryScope> {
		const ruc = await resolveCompanyRuc(companyId);
		const organizationId = await tryResolveOrganizationIdFromCompany(companyId);
		return {
			tenantId: organizationId === null ? "api" : String(organizationId),
			companyId: ruc,
			ruc,
		};
	},
};
