/**
 * Dual-Write Migration Audit Logger.
 *
 * Logs discrepancies between old dual-system guards and the new unified guard
 * during shadow-mode migration. All logs are structured JSON on stdout for
 * consumption by Fly.io / log aggregation.
 *
 * @module migration-audit
 */

export interface RbacDiscrepancy {
	route: string;
	operation: string;
	role: string;
	oldResult: "ALLOW" | "DENY";
	unifiedResult: "ALLOW" | "DENY";
	timestamp: string;
}

/**
 * Log a discrepancy between old and unified RBAC systems during shadow mode.
 *
 * - WARNING when old=ALLOW and unified=DENY (regression risk — unified would block)
 * - INFO when old=DENY and unified=ALLOW (new grant — unified would allow)
 *
 * @param route     — API route or surface identifier
 * @param operation — Permission being checked
 * @param role      — Caller's role string
 * @param oldResult — What the old dual-system decided
 * @param unifiedResult — What the unified guard decided
 */
export function logRbacDiscrepancy(
	route: string,
	operation: string,
	role: string,
	oldResult: "ALLOW" | "DENY",
	unifiedResult: "ALLOW" | "DENY",
): void {
	const payload: RbacDiscrepancy = {
		route,
		operation,
		role,
		oldResult,
		unifiedResult,
		timestamp: new Date().toISOString(),
	};

	const level =
		oldResult === "ALLOW" && unifiedResult === "DENY" ? "WARNING" : "INFO";

	// Structured JSON to stdout — consumed by Fly.io log aggregation
	const logLine = JSON.stringify({
		level,
		event: "rbac_dual_write_discrepancy",
		...payload,
	});

	if (level === "WARNING") {
		console.warn(logLine);
	} else {
		console.info(logLine);
	}
}
