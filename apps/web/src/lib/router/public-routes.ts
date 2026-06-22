const PUBLIC_ROUTE_PREFIXES = [
	"/login",
	"/auth",
	"/signup",
	"/forgot-password",
	"/reset-password",
	"/verify-email",
	"/onboarding",
] as const;

/** Routes that have their own layout (e.g. CodexShell) and must NOT be wrapped by MainLayout. */
const STANDALONE_ROUTE_PREFIXES = ["/drenyra"] as const;

export function isPublicRoute(pathname: string): boolean {
	return PUBLIC_ROUTE_PREFIXES.some((route) => pathname.startsWith(route));
}

/**
 * Routes that require authentication but provide their own layout
 * (bypassing MainLayout's sidebar/topbar).
 */
export function isStandaloneRoute(pathname: string): boolean {
	return STANDALONE_ROUTE_PREFIXES.some((route) => pathname.startsWith(route));
}

export function getPublicRoutePrefixes(): readonly string[] {
	return PUBLIC_ROUTE_PREFIXES;
}
