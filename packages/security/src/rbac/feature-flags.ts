/**
 * RBAC Feature Flags — run-time toggles for migration safety.
 *
 * @module feature-flags
 */

export const RBAC_FEATURE_FLAGS = {
	/**
	 * Master switch: when `false`, old dual-system guards decide.
	 *
	 * Default: `true` in test, `false` in production initially.
	 * Controlled by `UNIFIED_RBAC_ENABLED` env var.
	 */
	get UNIFIED_RBAC_ENABLED(): boolean {
		const env = (process.env.UNIFIED_RBAC_ENABLED ?? "").toLowerCase();
		if (env === "false" || env === "0") return false;
		return true;
	},

	/**
	 * When `UNIFIED_RBAC_ENABLED` is `false`, run unified guard in shadow mode
	 * and log discrepancies without affecting the decision.
	 *
	 * Controlled by `DUAL_WRITE_SHADOW_MODE` env var. Default: `true`.
	 */
	get DUAL_WRITE_SHADOW_MODE(): boolean {
		const env = (process.env.DUAL_WRITE_SHADOW_MODE ?? "").toLowerCase();
		if (env === "false" || env === "0") return false;
		return true;
	},
} as const;
