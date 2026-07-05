import type { CountryCode } from "./latam-country-packs";
import {
	DEFAULT_COUNTRY_CODE,
	resolveCountryCode,
} from "./latam-country-packs";

export interface StoredAuthUser {
	id?: string;
	legacyUserId?: string;
	name?: string;
	role?: string;
	companyId?: string;
	activeCompanyId?: string;
	countryCode?: CountryCode | string;
	organizationId?: number | string;
	companyName?: string;
	legalName?: string;
	businessName?: string;
	ruc?: string;
	availableCompanies?: Array<{
		companyId?: string;
		companyName?: string;
		ruc?: string;
		countryCode?: CountryCode | string;
		isDefault?: boolean;
	}>;
}

export interface CompanyContext {
	companyId: string;
	companyName: string;
	ruc: string;
	countryCode: CountryCode;
	isDemoFallback: boolean;
}

export const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000001";
export const DEMO_COMPANY_RUC = "20608451231";
export const DEMO_COMPANY_NAME = "NEBULA OPERACIONES LOGISTICAS S.A.C.";
export const ACTIVE_COMPANY_STORAGE_KEY = "drenyra-active-company";

export const AUTH_STORAGE_KEYS = [
	"drenyra-auth",
	"drenyra-auth-storage",
	"auth-storage",
] as const;

function normalizeString(value: unknown): string | null {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function normalizeRuc(value: unknown): string | null {
	const ruc = normalizeString(value);
	return ruc && /^\d{11}$/.test(ruc) ? ruc : null;
}

function buildCompanyContext(
	companyId: string,
	companyName: string,
	ruc: string,
	countryCode: CountryCode,
	isDemoFallback: boolean,
): CompanyContext {
	return {
		companyId,
		companyName,
		ruc,
		countryCode,
		isDemoFallback,
	};
}

export function getStoredAuthUser(): StoredAuthUser {
	if (typeof localStorage === "undefined") return {};

	try {
		for (const key of AUTH_STORAGE_KEYS) {
			const raw = localStorage.getItem(key);
			if (!raw) continue;

			const parsed = JSON.parse(raw);
			const state = parsed?.state ?? parsed;
			const user = state?.user;
			if (user && typeof user === "object") {
				return user as StoredAuthUser;
			}
		}
	} catch {
		// noop — LocalStorage unavailable or corrupted
	}

	return {};
}

export function mergeUserWithStoredCompanyContext<T extends StoredAuthUser>(
	user: T | null,
): T | null {
	if (!user) return null;

	const storedUser = getStoredAuthUser();
	const activeCompany = getStoredActiveCompanyContext();

	return {
		...storedUser,
		...user,
		companyId:
			normalizeString(activeCompany?.companyId) ??
			normalizeString(user.companyId) ??
			normalizeString(storedUser.companyId) ??
			undefined,
		companyName:
			normalizeString(activeCompany?.companyName) ??
			normalizeString(user.companyName) ??
			normalizeString(storedUser.companyName) ??
			normalizeString(storedUser.legalName) ??
			normalizeString(storedUser.businessName) ??
			undefined,
		ruc:
			normalizeRuc(activeCompany?.ruc) ??
			normalizeRuc(user.ruc) ??
			normalizeRuc(storedUser.ruc) ??
			undefined,
	};
}

export function getStoredActiveCompanyContext(): CompanyContext | null {
	if (typeof localStorage === "undefined") return null;

	try {
		const raw = localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY);
		if (!raw) return null;

		const parsed = JSON.parse(raw) as Partial<CompanyContext>;
		const companyId = normalizeString(parsed.companyId);
		const companyName = normalizeString(parsed.companyName);
		const ruc = normalizeRuc(parsed.ruc);
		const countryCode = resolveCountryCode(parsed.countryCode);

		if (!companyId || !companyName || !ruc) return null;

		return buildCompanyContext(companyId, companyName, ruc, countryCode, false);
	} catch {
		return null;
	}
}

export function getAvailableCompanyContexts(): CompanyContext[] {
	const user = getStoredAuthUser();
	const membershipCompanies = Array.isArray(user.availableCompanies)
		? user.availableCompanies
				.map((company) => {
					const companyId = normalizeString(company?.companyId);
					const companyName = normalizeString(company?.companyName);
					const ruc = normalizeRuc(company?.ruc);
					const countryCode = resolveCountryCode(company?.countryCode);
					if (!companyId || !companyName || !ruc) return null;

					return buildCompanyContext(
						companyId,
						companyName,
						ruc,
						countryCode,
						false,
					);
				})
				.filter((company): company is CompanyContext => company !== null)
		: [];

	if (membershipCompanies.length > 0) {
		return membershipCompanies;
	}

	const current = getCompanyContext();
	return [current];
}

export function setActiveCompanyContext(context: {
	companyId: string;
	companyName: string;
	ruc: string;
	countryCode?: CountryCode | string;
}): void {
	if (typeof localStorage === "undefined") return;

	const companyId = normalizeString(context.companyId);
	const companyName = normalizeString(context.companyName);
	const ruc = normalizeRuc(context.ruc);
	const countryCode = resolveCountryCode(context.countryCode);
	if (!companyId || !companyName || !ruc) return;

	localStorage.setItem(
		ACTIVE_COMPANY_STORAGE_KEY,
		JSON.stringify(
			buildCompanyContext(companyId, companyName, ruc, countryCode, false),
		),
	);

	if (typeof window !== "undefined") {
		window.dispatchEvent(new Event("drenyra-active-company-changed"));
	}
}

export function clearActiveCompanyContext(): void {
	if (typeof localStorage === "undefined") return;
	localStorage.removeItem(ACTIVE_COMPANY_STORAGE_KEY);

	if (typeof window !== "undefined") {
		window.dispatchEvent(new Event("drenyra-active-company-changed"));
	}
}

export function syncActiveCompanyContextFromUser(
	user: StoredAuthUser | null | undefined,
): void {
	const preferredCompanyId =
		normalizeString(user?.activeCompanyId) ?? normalizeString(user?.companyId);
	const matchingActiveCompany =
		preferredCompanyId && Array.isArray(user?.availableCompanies)
			? user?.availableCompanies.find(
					(company) =>
						normalizeString(company?.companyId) === preferredCompanyId,
				)
			: null;

	const companyId =
		normalizeString(matchingActiveCompany?.companyId) ??
		normalizeString(user?.companyId);
	const companyName =
		normalizeString(matchingActiveCompany?.companyName) ??
		normalizeString(user?.companyName) ??
		normalizeString(user?.legalName) ??
		normalizeString(user?.businessName);
	const ruc =
		normalizeRuc(matchingActiveCompany?.ruc) ?? normalizeRuc(user?.ruc);
	const countryCode =
		resolveCountryCode(matchingActiveCompany?.countryCode) ??
		resolveCountryCode(user?.countryCode);

	if (!companyId || !companyName || !ruc) {
		clearActiveCompanyContext();
		return;
	}

	setActiveCompanyContext({ companyId, companyName, ruc, countryCode });
}

export function getCompanyContext(): CompanyContext {
	const activeCompany = getStoredActiveCompanyContext();
	if (activeCompany) return activeCompany;

	const user = getStoredAuthUser();
	const companyId = normalizeString(user.companyId);

	if (!companyId) {
		return buildCompanyContext(
			DEMO_COMPANY_ID,
			DEMO_COMPANY_NAME,
			DEMO_COMPANY_RUC,
			DEFAULT_COUNTRY_CODE,
			true,
		);
	}

	return buildCompanyContext(
		companyId,
		normalizeString(user.companyName) ??
			normalizeString(user.legalName) ??
			normalizeString(user.businessName) ??
			"Empresa Activa",
		normalizeRuc(user.ruc) ?? "RUC pendiente",
		resolveCountryCode(user.countryCode),
		false,
	);
}
