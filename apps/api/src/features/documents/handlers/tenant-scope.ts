import { integer, pgTable, varchar } from "drizzle-orm/pg-core";
import { eq } from "@drenyra/persistence/query";
import { db, schema } from "../../../lib/db";

const legacyOrganizations = pgTable("organizations", {
	id: integer("id").primaryKey(),
	ruc: varchar("ruc", { length: 11 }).notNull(),
});

/**
 * TenantScopeInput interface.
 *
 * @example
 * ```ts
 * const value: TenantScopeInput = {} as TenantScopeInput;
 * console.log(value);
 * ```
 */
export interface TenantScopeInput {
	organizationId?: number;
	companyId?: string;
}

/**
 * ResolvedTenantScope interface.
 *
 * @example
 * ```ts
 * const value: ResolvedTenantScope = {} as ResolvedTenantScope;
 * console.log(value);
 * ```
 */
export interface ResolvedTenantScope {
	organizationId?: number;
	companyId?: string;
}

type HeaderContainer = Headers | Record<string, unknown> | undefined;

function readHeaderValue(headers: HeaderContainer, key: string): string {
	if (!headers) return "";

	if (headers instanceof Headers) {
		return headers.get(key) ?? headers.get(key.toLowerCase()) ?? "";
	}

	const direct = headers[key];
	if (typeof direct === "string") return direct;

	const lower = headers[key.toLowerCase()];
	if (typeof lower === "string") return lower;

	return "";
}

/**
 * readTenantScopeFromHeaders operation.
 *
 * @param headers - Input for headers.
 * @returns Result of readTenantScopeFromHeaders.
 * @example
 * ```ts
 * const result = readTenantScopeFromHeaders({} as HeaderContainer);
 * console.log(result);
 * ```
 */
export function readTenantScopeFromHeaders(
	headers: HeaderContainer,
): TenantScopeInput {
	const organizationIdRaw = readHeaderValue(headers, "x-organization-id").trim();
	const companyId = readHeaderValue(headers, "x-company-id").trim();
	const organizationId =
		organizationIdRaw && Number.isFinite(Number(organizationIdRaw))
			? Number(organizationIdRaw)
			: undefined;

	return {
		organizationId,
		companyId: companyId || undefined,
	};
}

/**
 * ResolveOrganizationIdFromCompanyId type.
 *
 * @example
 * ```ts
 * const value: ResolveOrganizationIdFromCompanyId = {} as ResolveOrganizationIdFromCompanyId;
 * console.log(value);
 * ```
 */
export type ResolveOrganizationIdFromCompanyId = (
	companyId: string,
) => Promise<number | null>;

/**
 * resolveOrganizationIdFromCompanyId operation.
 *
 * @param companyId - Input for companyId.
 * @returns Result of resolveOrganizationIdFromCompanyId.
 * @example
 * ```ts
 * const result = await resolveOrganizationIdFromCompanyId("");
 * console.log(result);
 * ```
 */
export async function resolveOrganizationIdFromCompanyId(
	companyId: string,
): Promise<number | null> {
	const normalizedCompanyId = companyId.trim();
	if (!normalizedCompanyId) return null;

	const companyRows = await db
		.select({ ruc: schema.companies.ruc })
		.from(schema.companies)
		.where(eq(schema.companies.id, normalizedCompanyId))
		.limit(1);

	if (companyRows.length === 0 || !companyRows[0]) {
		return null;
	}

	const organizationRows = await db
		.select({ id: legacyOrganizations.id })
		.from(legacyOrganizations)
		.where(eq(legacyOrganizations.ruc, companyRows[0].ruc))
		.limit(1);

	return organizationRows[0]?.id ?? null;
}

/**
 * normalizeTenantScope operation.
 *
 * @param input - Input for input.
 * @param resolveOrganizationId - Input for resolveOrganizationId.
 * @returns Result of normalizeTenantScope.
 * @example
 * ```ts
 * const result = await normalizeTenantScope({} as TenantScopeInput, {} as ResolveOrganizationIdFromCompanyId);
 * console.log(result);
 * ```
 */
export async function normalizeTenantScope(
	input: TenantScopeInput,
	resolveOrganizationId: ResolveOrganizationIdFromCompanyId,
): Promise<ResolvedTenantScope | null> {
	const organizationId =
		typeof input.organizationId === "number" && Number.isFinite(input.organizationId)
			? input.organizationId
			: undefined;
	const companyId =
		typeof input.companyId === "string" && input.companyId.trim()
			? input.companyId.trim()
			: undefined;

	if (companyId) {
		return {
			companyId,
			organizationId:
				organizationId ?? (await resolveOrganizationId(companyId)) ?? undefined,
		};
	}

	if (organizationId !== undefined) {
		return { organizationId };
	}

	return null;
}
