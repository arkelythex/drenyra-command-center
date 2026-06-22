import { and, eq, isNull, or, type SQL } from "drizzle-orm";
import { documents } from "../../schema/documents.schema";

/**
 * buildDocumentCompanyScope operation.
 *
 * @param companyId - Input for companyId.
 * @returns Result of buildDocumentCompanyScope.
 * @example
 * ```ts
 * const result = buildDocumentCompanyScope("");
 * console.log(result);
 * ```
 */
export const buildDocumentCompanyScope = (companyId: string): SQL =>
	eq(documents.companyId, companyId);

/**
 * buildDocumentCompanyCompatibilityScope operation.
 *
 * @param companyId - Input for companyId.
 * @param legacyOrganizationId - Input for legacyOrganizationId.
 * @returns Result of buildDocumentCompanyCompatibilityScope.
 * @example
 * ```ts
 * const result = buildDocumentCompanyCompatibilityScope("", 0);
 * console.log(result);
 * ```
 */
export const buildDocumentCompanyCompatibilityScope = (
	companyId: string,
	legacyOrganizationId: number | null,
): SQL =>
	legacyOrganizationId === null
		? buildDocumentCompanyScope(companyId)
		: or(
				buildDocumentCompanyScope(companyId),
				and(
					isNull(documents.companyId),
					eq(documents.organizationId, legacyOrganizationId),
				),
			)!;

/**
 * Transitional scope:
 * - Prefer the new `company_id`
 * - Fall back to legacy `organization_id` while older rows are still being
 *   backfilled
 * @param organizationId - Input for organizationId.
 * @param companyId - Input for companyId.
 * @returns Result of buildDocumentOrganizationScope.
 * @example
 * ```ts
 * const result = buildDocumentOrganizationScope(0, "");
 * console.log(result);
 * ```
 */

export const buildDocumentOrganizationScope = (
	organizationId: number,
	companyId: string | null,
): SQL =>
	companyId
		? or(
				buildDocumentCompanyScope(companyId),
				and(
					isNull(documents.companyId),
					eq(documents.organizationId, organizationId),
				),
			)!
		: eq(documents.organizationId, organizationId);
