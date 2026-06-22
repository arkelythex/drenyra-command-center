function isTruthy(value: string | undefined): boolean {
	return value === "1" || value?.toLowerCase() === "true";
}

function isReleaseEnvironment(): boolean {
	const env = (process.env.NODE_ENV ?? "").toLowerCase();
	return env === "production" || env === "staging";
}

const DEFAULT_ALLOWED_ROLES = ["owner", "senior", "admin", "superadmin"];

/** Prefer `primary`; if unset, use `legacy` (migration from FLUX_MVP_*). */
function readEnvPair(primary: string, legacy: string): string {
	if (process.env[primary] !== undefined) {
		return process.env[primary]?.trim() ?? "";
	}
	if (process.env[legacy] !== undefined) {
		return process.env[legacy]?.trim() ?? "";
	}
	return "";
}

/** Like readEnvPair but returns undefined when neither variable is set. */
function readOptionalEnvPair(
	primary: string,
	legacy: string,
): string | undefined {
	if (process.env[primary] !== undefined) {
		return process.env[primary]?.trim() ?? "";
	}
	if (process.env[legacy] !== undefined) {
		return process.env[legacy]?.trim() ?? "";
	}
	return undefined;
}

const ENDPOINT_ROLE_ENV: Record<LedgerMvpEndpoint, readonly [string, string]> =
	{
		sire_autopilot_run: [
			"LEDGER_MVP_ALLOWED_ROLES_SIRE_AUTOPILOT",
			"FLUX_MVP_ALLOWED_ROLES_SIRE_AUTOPILOT",
		],
		npif_basic_get: [
			"LEDGER_MVP_ALLOWED_ROLES_NPIF_BASIC",
			"FLUX_MVP_ALLOWED_ROLES_NPIF_BASIC",
		],
		monitor_fiscal_run: [
			"LEDGER_MVP_ALLOWED_ROLES_MONITOR_FISCAL",
			"FLUX_MVP_ALLOWED_ROLES_MONITOR_FISCAL",
		],
	};

export type LedgerMvpEndpoint =
	| "sire_autopilot_run"
	| "npif_basic_get"
	| "monitor_fiscal_run";

function getRawAllowlist(): string {
	return readEnvPair(
		"LEDGER_MVP_ALLOWED_COMPANY_IDS",
		"FLUX_MVP_ALLOWED_COMPANY_IDS",
	);
}

function parseRoleList(raw: string): string[] {
	const roles = raw
		.split(",")
		.map((value) => value.trim().toLowerCase())
		.filter(Boolean);

	return [...new Set(roles)];
}

/**
 * Resolves whether the Ledger MVP routes are available for the current runtime.
 *
 * @returns True when the feature is enabled or running outside release environments.
 * @example
 * ```ts
 * if (isLedgerMvpEnabled()) validateLedgerMvpStartupPolicy();
 * ```
 */
export function isLedgerMvpEnabled(): boolean {
	const raw = readOptionalEnvPair("LEDGER_MVP_ENABLED", "FLUX_MVP_ENABLED");
	if (raw === undefined || raw === "") {
		return !isReleaseEnvironment();
	}

	return isTruthy(raw);
}

/**
 * Enforces session-backed authentication for every Ledger MVP request.
 *
 * @returns Always true; the legacy disable flag is intentionally ignored.
 * @example
 * ```ts
 * const requireSession = shouldRequireLedgerMvpAuth();
 * ```
 */
export function shouldRequireLedgerMvpAuth(): boolean {
	return true;
}

/**
 * Reads the tenant allowlist used to scope Ledger MVP rollout access.
 *
 * @returns Company identifiers allowed in release environments.
 * @example
 * ```ts
 * const tenants = getLedgerMvpTenantAllowlist();
 * ```
 */
export function getLedgerMvpTenantAllowlist(): string[] {
	const raw = getRawAllowlist();
	if (!raw) return [];

	return raw
		.split(",")
		.map((value) => value.trim())
		.filter(Boolean);
}

/**
 * Resolves default roles allowed to execute Ledger MVP workflows.
 *
 * @returns Lowercase role names configured by environment or the safe default set.
 * @example
 * ```ts
 * const roles = getLedgerMvpAllowedRoles();
 * ```
 */
export function getLedgerMvpAllowedRoles(): string[] {
	const raw = readEnvPair("LEDGER_MVP_ALLOWED_ROLES", "FLUX_MVP_ALLOWED_ROLES");
	if (!raw) {
		return [...DEFAULT_ALLOWED_ROLES];
	}

	const roles = parseRoleList(raw);
	if (roles.length === 0) {
		return [...DEFAULT_ALLOWED_ROLES];
	}

	return roles;
}

/**
 * Resolves endpoint-specific Ledger MVP role policy with fallback to default roles.
 *
 * @param endpoint - Ledger MVP route capability being authorized.
 * @returns Lowercase role names allowed for that endpoint.
 * @example
 * ```ts
 * const roles = getLedgerMvpAllowedRolesForEndpoint("sire_autopilot_run");
 * ```
 */
export function getLedgerMvpAllowedRolesForEndpoint(
	endpoint: LedgerMvpEndpoint,
): string[] {
	const [primary, legacy] = ENDPOINT_ROLE_ENV[endpoint];
	const raw = readEnvPair(primary, legacy);
	if (!raw) {
		return getLedgerMvpAllowedRoles();
	}

	const roles = parseRoleList(raw);
	if (roles.length === 0) {
		return getLedgerMvpAllowedRoles();
	}

	return roles;
}

/**
 * Checks whether a caller role may access a Ledger MVP endpoint.
 *
 * @param endpoint - Ledger MVP route capability being authorized.
 * @param role - Caller role resolved from a trusted session context.
 * @returns True when the normalized role is allowed for the endpoint.
 * @example
 * ```ts
 * isLedgerMvpRoleAllowed("monitor_fiscal_run", "admin");
 * ```
 */
export function isLedgerMvpRoleAllowed(
	endpoint: LedgerMvpEndpoint,
	role: string,
): boolean {
	const normalizedRole = role.trim().toLowerCase();
	if (!normalizedRole) return false;
	return getLedgerMvpAllowedRolesForEndpoint(endpoint).includes(normalizedRole);
}

/**
 * Checks tenant rollout access for a company before fiscal workflow execution.
 *
 * @param companyId - Tenant/company identifier requested by the route payload.
 * @returns True when no allowlist is configured or the company is explicitly allowed.
 * @example
 * ```ts
 * if (!isCompanyAllowedForLedgerMvp(companyId)) throw new Error("tenant denied");
 * ```
 */
export function isCompanyAllowedForLedgerMvp(companyId: string): boolean {
	const allowlist = getLedgerMvpTenantAllowlist();
	if (allowlist.length === 0) {
		return true;
	}

	return allowlist.includes(companyId);
}

/**
 * Validates release-environment rollout policy before Ledger MVP routes serve traffic.
 *
 * @throws Error when a release environment enables Ledger MVP without a tenant allowlist.
 * @example
 * ```ts
 * validateLedgerMvpStartupPolicy();
 * ```
 */
export function validateLedgerMvpStartupPolicy(): void {
	if (!isLedgerMvpEnabled()) {
		return;
	}

	if (isReleaseEnvironment() && getLedgerMvpTenantAllowlist().length === 0) {
		throw new Error(
			"Invalid Ledger MVP policy: LEDGER_MVP_ALLOWED_COMPANY_IDS (or legacy FLUX_MVP_ALLOWED_COMPANY_IDS) must define at least one pilot tenant in release environments when Ledger MVP is enabled.",
		);
	}
}
