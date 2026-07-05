/**
 * CheckReadyQuery — Performs the /health/ready readiness check.
 *
 * Extracted from the inline route handler for CQRS compliance.
 *
 * @module health/application/queries
 */

import { sql } from "@drenyra/persistence/query";

export interface ReadyCheckResult {
	status: "ready" | "degraded";
	timestamp: string;
	checks: Record<string, string>;
}

export interface ReadyCheckDeps {
	dbExecute: (query: ReturnType<typeof sql>) => Promise<unknown>;
	loggerInfo: (obj: Record<string, unknown>, msg: string) => void;
	fetchFn: typeof fetch;
}

/**
 * Performs the health readiness check against database and Inngest.
 *
 * @param deps - Injected dependencies (db, logger, fetch)
 * @returns The readiness check result
 *
 * @example
 * ```ts
 * const result = await checkReady({ dbExecute, loggerInfo, fetchFn });
 * ```
 */
export async function checkReady(
	deps: ReadyCheckDeps,
): Promise<ReadyCheckResult> {
	const { dbExecute, loggerInfo, fetchFn } = deps;

	const checks = await Promise.allSettled([
		dbExecute(sql`SELECT 1 as health_check`).then(() => ({
			name: "database",
			status: "ok" as const,
		})),
		fetchFn(process.env.INNGEST_URL || "http://localhost:8288/health", {
			signal: AbortSignal.timeout(2000),
		})
			.then((res) => ({
				name: "inngest",
				status: res.ok ? ("ok" as const) : ("error" as const),
			}))
			.catch(() => ({
				name: "inngest" as const,
				status: "unreachable" as const,
			})),
	]);

	const results = checks.map((check) =>
		check.status === "fulfilled"
			? check.value
			: { name: "unknown", status: "error" as const },
	);
	const allHealthy = results.every((r) => r.status === "ok");

	loggerInfo(
		{ checks: results },
		`Health check: ${allHealthy ? "ready" : "degraded"}`,
	);

	return {
		status: allHealthy ? "ready" : "degraded",
		timestamp: new Date().toISOString(),
		checks: results.reduce(
			(acc, check) => {
				acc[check.name] = check.status;
				return acc;
			},
			{} as Record<string, string>,
		),
	};
}
