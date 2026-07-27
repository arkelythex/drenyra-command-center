/**
 * Route Permission Registry
 *
 * Central map of route patterns to required permissions.
 * Applied as a global onBeforeHandle in app-core.ts.
 *
 * Permission type references now also accept `BusinessPermission` from the
 * unified module for forward compatibility.
 *
 * @module route-permissions
 */

import type { Permission } from "@drenyra/infrastructure/auth";

export interface RoutePermissionEntry {
	/** URL pattern — supports :param placeholders and * wildcard */
	pattern: string;
	/** HTTP method — "*" means any method */
	method: string | "*";
	/** Required permission(s) — any match grants access */
	permissions: Permission[];
	/** If true, skip permission check (public endpoints like auth, health) */
	isPublic?: boolean;
}

/**
 * Canonical route permission map.
 *
 * Rules:
 * - Public routes (auth, health, swagger) are marked isPublic
 * - Admin routes require owner role
 * - Read routes require the matching :read permission
 * - Write routes require the matching :create or :update permission
 * - Delete routes require the matching :delete permission
 *
 * Forward-compatible: Permission values match the unified `business:*` prefix
 * when the feature flag is enabled (mapping happens in the guard).
 */
export const ROUTE_PERMISSIONS: RoutePermissionEntry[] = [
	// ── Public routes (no auth required) ──
	{ pattern: "/api/health", method: "*", permissions: [], isPublic: true },
	{ pattern: "/api/swagger", method: "*", permissions: [], isPublic: true },
	{
		pattern: "/api/auth/signup",
		method: "POST",
		permissions: [],
		isPublic: true,
	},
	{
		pattern: "/api/auth/login",
		method: "POST",
		permissions: [],
		isPublic: true,
	},
	{
		pattern: "/api/auth/forgot-password",
		method: "POST",
		permissions: [],
		isPublic: true,
	},
	{
		pattern: "/api/auth/reset-password",
		method: "POST",
		permissions: [],
		isPublic: true,
	},
	{
		pattern: "/api/auth/verify-email",
		method: "POST",
		permissions: [],
		isPublic: true,
	},
	{
		pattern: "/api/auth/send-verification",
		method: "POST",
		permissions: [],
		isPublic: true,
	},
	{
		pattern: "/api/auth/logout",
		method: "POST",
		permissions: [],
		isPublic: true,
	},
	{
		pattern: "/api/auth/session",
		method: "GET",
		permissions: [],
		isPublic: true,
	},

	// ── Company management ──
	{
		pattern: "/api/companies",
		method: "GET",
		permissions: ["company:read"],
	},
	{
		pattern: "/api/companies/:id",
		method: "GET",
		permissions: ["company:read"],
	},
	{
		pattern: "/api/companies",
		method: "POST",
		permissions: ["company:create"],
	},
	{
		pattern: "/api/companies/:id",
		method: "PUT",
		permissions: ["company:update"],
	},
	{
		pattern: "/api/companies/:id",
		method: "DELETE",
		permissions: ["company:delete"],
	},

	// ── Journal entries ──
	{
		pattern: "/api/journal-entries",
		method: "GET",
		permissions: ["journal:read"],
	},
	{
		pattern: "/api/journal-entries/:id",
		method: "GET",
		permissions: ["journal:read"],
	},
	{
		pattern: "/api/journal-entries",
		method: "POST",
		permissions: ["journal:create"],
	},
	{
		pattern: "/api/journal-entries/:id",
		method: "PUT",
		permissions: ["journal:update"],
	},
	{
		pattern: "/api/journal-entries/:id",
		method: "DELETE",
		permissions: ["journal:delete"],
	},

	// ── SUNAT ──
	{
		pattern: "/api/sunat/:action",
		method: "GET",
		permissions: ["sunat:read"],
	},
	{
		pattern: "/api/sunat/:action",
		method: "POST",
		permissions: ["sunat:declare"],
	},

	// ── Accounting ──
	{
		pattern: "/api/accounting/close",
		method: "POST",
		permissions: ["accounting:close"],
	},
	{
		pattern: "/api/accounting/open",
		method: "POST",
		permissions: ["accounting:open"],
	},

	// ── Reports ──
	{
		pattern: "/api/reports/full",
		method: "GET",
		permissions: ["reports:read_all"],
	},
	{
		pattern: "/api/reports/operational",
		method: "GET",
		permissions: ["reports:read_operational"],
	},
	{
		pattern: "/api/reports/basic",
		method: "GET",
		permissions: ["reports:read_basic"],
	},

	// ── Users ──
	{ pattern: "/api/users", method: "GET", permissions: ["users:read"] },
	{
		pattern: "/api/users/invite",
		method: "POST",
		permissions: ["users:invite_team"],
	},
	{
		pattern: "/api/users/staff",
		method: "POST",
		permissions: ["users:create_staff"],
	},

	// ── Audit ──
	{ pattern: "/api/audit", method: "GET", permissions: ["audit:read"] },

	// ── Payroll ──
	{ pattern: "/api/payroll", method: "GET", permissions: ["payroll:read"] },
	{
		pattern: "/api/payroll",
		method: "POST",
		permissions: ["payroll:manage"],
	},

	// ── Default: require basic auth for everything else ──
	{ pattern: "/api/*", method: "*", permissions: ["company:read"] },
];

/**
 * Convert a route pattern string into a RegExp for matching.
 */
function patternToRegex(pattern: string): RegExp {
	const escaped = pattern
		.replace(/[.+^${}()|[\]\\]/g, "\\$&")
		.replace(/:\w+/g, "[^/]+")
		.replace(/\*/g, ".*");
	return new RegExp(`^${escaped}$`);
}

/**
 * Match a request URL + method against the route permission map.
 */
export function matchRoute(
	url: string,
	method: string,
): RoutePermissionEntry | undefined {
	const path: string = url.split("?")[0] ?? "";

	for (const entry of ROUTE_PERMISSIONS) {
		if (entry.method !== "*" && entry.method !== method) continue;
		const regex = patternToRegex(entry.pattern);
		if (regex.test(path)) return entry;
	}

	return undefined;
}
