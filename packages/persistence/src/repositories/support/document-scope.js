import { and, eq, isNull, or } from "drizzle-orm";
import { documents } from "../../schema/documents.schema";
export const buildDocumentCompanyScope = (companyId) =>
	eq(documents.companyId, companyId);
export const buildDocumentCompanyCompatibilityScope = (
	companyId,
	legacyOrganizationId,
) =>
	legacyOrganizationId === null
		? buildDocumentCompanyScope(companyId)
		: or(
				buildDocumentCompanyScope(companyId),
				and(
					isNull(documents.companyId),
					eq(documents.organizationId, legacyOrganizationId),
				),
			);
export const buildDocumentOrganizationScope = (organizationId, companyId) =>
	companyId
		? or(
				buildDocumentCompanyScope(companyId),
				and(
					isNull(documents.companyId),
					eq(documents.organizationId, organizationId),
				),
			)
		: eq(documents.organizationId, organizationId);
//# sourceMappingURL=document-scope.js.map
