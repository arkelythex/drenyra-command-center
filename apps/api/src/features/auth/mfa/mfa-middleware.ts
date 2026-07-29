/**
 * MFA Step-Up Middleware.
 *
 * Intercepts requests to routes marked `requireMfa: true` in the
 * Route Protection Matrix. If the session does not have `mfaVerified`,
 * the request is rejected with a 401 MFA_STEPUP challenge.
 *
 * When TOTP_ENABLED=false, the middleware is a no-op.
 *
 * @module auth/mfa/middleware
 */

import { MFA_FEATURE_FLAGS } from "@drenyra/security/mfa";
import { createLogger } from "../../../lib/logger";

const logger = createLogger({
	feature: "auth",
	handler: "mfa-middleware",
});

interface MfaMiddlewareOptions {
	/** Whether the route requires MFA step-up */
	requireMfa: boolean;
}

/**
 * Check if the current session has MFA verified.
 * Returns true if MFA is not required or if the session has MFA verified.
 */
export function checkMfaStepUp(
	options: MfaMiddlewareOptions,
	session: { mfaVerified?: boolean } | null,
): { allowed: boolean; reason?: string } {
	// Global MFA disable — no-op
	if (!MFA_FEATURE_FLAGS.TOTP_ENABLED) {
		return { allowed: true };
	}

	// Route does not require MFA
	if (!options.requireMfa) {
		return { allowed: true };
	}

	// No session — auth middleware handles this separately
	if (!session) {
		return { allowed: true };
	}

	// Session has MFA verified
	if (session.mfaVerified) {
		return { allowed: true };
	}

	// MFA step-up required
	logger.warn("MFA step-up required for protected route");
	return {
		allowed: false,
		reason: "MFA_STEPUP",
	};
}

/**
 * Resolve requireMfa from a RouteProtectionMatrixRow.
 * Gracefully handles missing field (pre-Phase 2 matrices).
 */
export function resolveRequireMfa(
	routeMatrix: { requireMfa?: boolean } | undefined,
): boolean {
	return routeMatrix?.requireMfa ?? false;
}
