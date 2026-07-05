import { db } from "@drenyra/persistence/client";
import { asc, desc, eq } from "@drenyra/persistence/query";
import { authUserCompanies, companies } from "@drenyra/persistence/schema";

/**
 * AccessibleCompany interface.
 *
 * @example
 * ```ts
 * const value: AccessibleCompany = {} as AccessibleCompany;
 * console.log(value);
 * ```
 */
export interface AccessibleCompany {
	companyId: string;
	companyName: string;
	ruc: string;
	countryCode: string;
	membershipRole: string;
	isDefault: boolean;
}

/**
 * normalizeSessionString operation.
 *
 * @param value - Input for value.
 * @returns Result of normalizeSessionString.
 * @example
 * ```ts
 * const result = normalizeSessionString(undefined);
 * console.log(result);
 * ```
 */
export function normalizeSessionString(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}

/**
 * normalizeSessionRuc operation.
 *
 * @param value - Input for value.
 * @returns Result of normalizeSessionRuc.
 * @example
 * ```ts
 * const result = normalizeSessionRuc(undefined);
 * console.log(result);
 * ```
 */
export function normalizeSessionRuc(value: unknown): string {
	const ruc = normalizeSessionString(value);
	return /^\d{11}$/.test(ruc) ? ruc : "";
}

/**
 * listUserCompanyMemberships operation.
 *
 * @param userId - Input for userId.
 * @returns Result of listUserCompanyMemberships.
 * @example
 * ```ts
 * const result = await listUserCompanyMemberships("");
 * console.log(result);
 * ```
 */
export async function listUserCompanyMemberships(
	userId: string,
): Promise<AccessibleCompany[]> {
	const rows = await db
		.select({
			companyId: authUserCompanies.companyId,
			companyName: companies.businessName,
			ruc: companies.ruc,
			countryCode: companies.countryCode,
			membershipRole: authUserCompanies.membershipRole,
			isDefault: authUserCompanies.isDefault,
		})
		.from(authUserCompanies)
		.innerJoin(companies, eq(authUserCompanies.companyId, companies.id))
		.where(eq(authUserCompanies.userId, userId))
		.orderBy(desc(authUserCompanies.isDefault), asc(companies.businessName));

	return rows.map((row) => ({
		companyId: row.companyId,
		companyName: row.companyName,
		ruc: row.ruc,
		countryCode: row.countryCode,
		membershipRole: row.membershipRole,
		isDefault: row.isDefault,
	}));
}

/**
 * ensureUserCompanyMembershipFromRuc operation.
 *
 * @param userId - Input for userId.
 * @param ruc - Input for ruc.
 * @returns Result of ensureUserCompanyMembershipFromRuc.
 * @example
 * ```ts
 * const result = await ensureUserCompanyMembershipFromRuc("", "");
 * console.log(result);
 * ```
 */
export async function ensureUserCompanyMembershipFromRuc(
	userId: string,
	ruc: string,
): Promise<AccessibleCompany | null> {
	const companyRows = await db
		.select({
			id: companies.id,
			businessName: companies.businessName,
			ruc: companies.ruc,
			countryCode: companies.countryCode,
		})
		.from(companies)
		.where(eq(companies.ruc, ruc))
		.limit(1);

	const company = companyRows[0];
	if (!company) return null;

	await db
		.insert(authUserCompanies)
		.values({
			id: `${userId}:${company.id}`,
			userId,
			companyId: company.id,
			membershipRole: "OWNER",
			isDefault: true,
		})
		.onConflictDoNothing();

	return {
		companyId: company.id,
		companyName: company.businessName,
		ruc: company.ruc,
		countryCode: company.countryCode,
		membershipRole: "OWNER",
		isDefault: true,
	};
}
