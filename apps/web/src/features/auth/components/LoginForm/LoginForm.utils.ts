import type { User } from "../../types/auth.types";

export function resolveSafeLoginRedirect(search: string): string {
	const redirect = new URLSearchParams(search).get("redirect");

	if (!redirect) return "/";

	const isSameAppPath =
		redirect.startsWith("/") &&
		!redirect.startsWith("//") &&
		!redirect.includes("://");

	return isSameAppPath ? redirect : "/";
}

/** A signed-in user with no company yet registers one before anything else. */
export function needsCompanyOnboarding(user: User | null | undefined): boolean {
	if (!user) return false;
	const companies = user.availableCompanies ?? [];
	return !user.activeCompanyId && !user.companyId && companies.length === 0;
}
