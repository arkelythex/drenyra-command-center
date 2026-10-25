import { createLogger } from "../../../lib/logger";
import type { AccessibleCompany } from "./company-membership";
import {
	listUserCompanyMemberships,
	normalizeSessionString,
} from "./company-membership";

const logger = createLogger({
	feature: "auth",
	handler: "session-company-context",
});

interface SessionUserLike {
	id?: string;
	email?: string;
	name?: string;
	role?: string;
	ruc?: string | null;
	countryCode?: string;
	companyId?: string;
	companyName?: string;
	activeCompanyId?: string;
	legacyUserId?: string;
	availableCompanies?: AccessibleCompany[];
}

function resolveActiveCompany(
	user: SessionUserLike,
	availableCompanies: AccessibleCompany[],
): AccessibleCompany | null {
	if (availableCompanies.length === 0) return null;

	const explicitCompanyId =
		normalizeSessionString(user.activeCompanyId) ||
		normalizeSessionString(user.companyId);
	if (explicitCompanyId) {
		const explicit = availableCompanies.find(
			(company) => company.companyId === explicitCompanyId,
		);
		if (explicit) return explicit;
	}

	return (
		availableCompanies.find((company) => company.isDefault) ??
		availableCompanies[0] ??
		null
	);
}

/**
 * enrichSessionUserWithCompanyContext operation.
 *
 * @typeParam T - Generic type parameter for enrichSessionUserWithCompanyContext.
 * @param user - Input for user.
 * @returns Result of enrichSessionUserWithCompanyContext.
 * @example
 * ```ts
 * const result = await enrichSessionUserWithCompanyContext({} as T);
 * console.log(result);
 * ```
 */
export async function enrichSessionUserWithCompanyContext<
	T extends SessionUserLike,
>(
	user: T | null | undefined,
): Promise<
	| (T & {
			activeCompanyId?: string;
			availableCompanies?: AccessibleCompany[];
			legacyUserId?: string;
	  })
	| null
> {
	if (!user) return null;

	const userId = normalizeSessionString(user.id);

	try {
		// Only memberships grant companies. The RUC typed at signup is never
		// used to join an existing company: anyone can type a RUC.
		const availableCompanies =
			userId.length > 0 ? await listUserCompanyMemberships(userId) : [];

		const activeCompany = resolveActiveCompany(user, availableCompanies);

		if (!activeCompany) {
			return {
				...user,
			};
		}

		return {
			...user,
			// Role-gated routes read the session role; it is the membership role
			// in the active company, never one the user record claims.
			role: activeCompany.membershipRole.trim().toLowerCase(),
			countryCode: activeCompany.countryCode,
			companyId: activeCompany.companyId,
			companyName: activeCompany.companyName,
			activeCompanyId: activeCompany.companyId,
			availableCompanies,
		};
	} catch (error) {
		logger.warn({ error, userId }, "Failed to resolve session company context");
		return user;
	}
}
