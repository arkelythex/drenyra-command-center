/**
 * Active company (tenant) context for the web app.
 *
 * The signed-in user's company data is persisted so that every request is
 * scoped to one company, and a company can only be activated if it is in the
 * list the session granted (`availableCompanies`).
 */
import type { User, UserCompanyAccess } from "@/features/auth/types/auth.types";
import { clearFiscalPeriod } from "./fiscal-period";

export const DEMO_COMPANY_ID = "demo-1";
export const DEMO_COMPANY_NAME = "Demo Company";
export const DEMO_COMPANY_RUC = "20123456789";

/** zustand-persisted auth state (current key first, legacy key after). */
export const AUTH_STORAGE_KEYS = [
	"drenyra-auth-storage",
	"drenyra-auth",
] as const;
export const ACTIVE_COMPANY_STORAGE_KEY = "drenyra-active-company";
export const ACTIVE_COMPANY_CHANGED_EVENT = "drenyra-active-company-changed";

export interface CompanyContext {
	companyId: string;
	companyName: string;
	ruc: string;
	countryCode: string;
}

interface StoredCompanyState {
	active: CompanyContext;
	available: CompanyContext[];
}

const COMPANY_FIELDS = [
	"legacyUserId",
	"companyId",
	"companyName",
	"ruc",
	"countryCode",
] as const;

function hasStorage(): boolean {
	return typeof localStorage !== "undefined";
}

function notifyChanged(): void {
	if (typeof window !== "undefined") {
		window.dispatchEvent(new Event(ACTIVE_COMPANY_CHANGED_EVENT));
	}
}

function toCompanyContext(access: {
	companyId: string;
	companyName: string;
	ruc: string;
	countryCode?: string | undefined;
}): CompanyContext {
	return {
		companyId: access.companyId,
		companyName: access.companyName,
		ruc: access.ruc,
		countryCode: (access.countryCode ?? "PE").toUpperCase(),
	};
}

function isCompanyContext(value: unknown): value is CompanyContext {
	const c = value as Partial<CompanyContext> | null;
	return (
		!!c &&
		typeof c.companyId === "string" &&
		c.companyId.length > 0 &&
		typeof c.companyName === "string" &&
		typeof c.ruc === "string" &&
		typeof c.countryCode === "string"
	);
}

function readStoredAuthUser(): Partial<User> | null {
	if (!hasStorage()) return null;
	for (const key of AUTH_STORAGE_KEYS) {
		try {
			const raw = localStorage.getItem(key);
			if (!raw) continue;
			const user = (JSON.parse(raw) as { state?: { user?: Partial<User> } })
				.state?.user;
			if (user && typeof user === "object") return user;
		} catch {
			// Corrupt entry: try the next key.
		}
	}
	return null;
}

/**
 * Fills company fields missing on the live session user with the persisted
 * ones. Fields present on the live user always win.
 */
export function mergeUserWithStoredCompanyContext<T extends Partial<User>>(
	user: T,
): T;
export function mergeUserWithStoredCompanyContext(user: unknown): unknown;
export function mergeUserWithStoredCompanyContext(user: unknown): unknown {
	if (!user || typeof user !== "object") return user;
	const stored = readStoredAuthUser();
	if (!stored) return user;

	const live = user as Record<string, unknown>;
	const merged: Record<string, unknown> = { ...live };
	for (const field of COMPANY_FIELDS) {
		if (merged[field] == null && stored[field] != null) {
			merged[field] = stored[field];
		}
	}
	return merged;
}

function readStoredCompanyState(): StoredCompanyState | null {
	if (!hasStorage()) return null;
	try {
		const raw = localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<StoredCompanyState>;
		if (!isCompanyContext(parsed.active)) return null;
		const available = Array.isArray(parsed.available)
			? parsed.available.filter(isCompanyContext)
			: [];
		return { active: parsed.active, available };
	} catch {
		return null;
	}
}

function writeStoredCompanyState(state: StoredCompanyState): void {
	if (!hasStorage()) return;
	localStorage.setItem(ACTIVE_COMPANY_STORAGE_KEY, JSON.stringify(state));
	notifyChanged();
}

/** Raw persisted value; lets subscribers get a referentially stable snapshot. */
export function readActiveCompanyRaw(): string | null {
	if (!hasStorage()) return null;
	try {
		return localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY);
	} catch {
		return null;
	}
}

export function readActiveCompanyState(): StoredCompanyState | null {
	return readStoredCompanyState();
}

/** Derives the active company (and the ones the user may switch to) from the session user. */
export function syncActiveCompanyContextFromUser(user: unknown): void {
	if (!user || typeof user !== "object") return;
	const u = user as Partial<User>;

	const available = (u.availableCompanies ?? []).map(toCompanyContext);
	const fromList =
		available.find((c) => c.companyId === u.activeCompanyId) ??
		(u.availableCompanies?.find((c) => c.isDefault)
			? toCompanyContext(
					u.availableCompanies.find((c) => c.isDefault) as UserCompanyAccess,
				)
			: undefined) ??
		available[0];
	const fromUser =
		u.companyId && u.companyName && u.ruc
			? toCompanyContext({
					companyId: u.companyId,
					companyName: u.companyName,
					ruc: u.ruc,
					countryCode: u.countryCode,
				})
			: undefined;

	const active = fromList ?? fromUser;
	if (!active) return;

	// Keep a previously chosen company if the session still grants it.
	const previous = readStoredCompanyState()?.active;
	const keepPrevious = previous
		? available.some((c) => c.companyId === previous.companyId)
		: false;

	writeStoredCompanyState({
		active: keepPrevious && previous ? previous : active,
		available: available.length > 0 ? available : [active],
	});
}

/** Switches the active company; refuses ids the session did not grant. */
export function setActiveCompanyById(companyId: string): boolean {
	const state = readStoredCompanyState();
	const next = state?.available.find((c) => c.companyId === companyId);
	if (!state || !next) return false;
	writeStoredCompanyState({ ...state, active: next });
	return true;
}

export function clearActiveCompanyContext(): void {
	if (hasStorage()) {
		localStorage.removeItem(ACTIVE_COMPANY_STORAGE_KEY);
		notifyChanged();
	}
	clearFiscalPeriod();
}
