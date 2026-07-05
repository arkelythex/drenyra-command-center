/**
 * CheckStartupQuery — Performs the /health/startup check.
 *
 * Extracted from the inline route handler for CQRS compliance.
 *
 * @module health/application/queries
 */

import { sql } from "@drenyra/persistence/query";
import type { TaxationBootstrapStatus } from "./check-doctor";

export interface StartupCheckResult {
	status: "started" | "starting";
	timestamp: string;
	error?: string;
	taxationEvents: TaxationBootstrapStatus;
}

export interface StartupCheckDeps {
	dbExecute: (query: ReturnType<typeof sql>) => Promise<unknown>;
	readTaxationBootstrapStatus: () => TaxationBootstrapStatus;
}

/**
 * Performs the startup health check — verifies database connectivity.
 *
 * @param deps - Injected dependencies
 * @returns The startup status result
 *
 * @example
 * ```ts
 * const result = await checkStartup({ dbExecute, readTaxationBootstrapStatus });
 * ```
 */
export async function checkStartup(
	deps: StartupCheckDeps,
): Promise<StartupCheckResult> {
	const { dbExecute, readTaxationBootstrapStatus } = deps;

	try {
		await dbExecute(sql`SELECT 1`);
		return {
			status: "started",
			timestamp: new Date().toISOString(),
			taxationEvents: readTaxationBootstrapStatus(),
		};
	} catch (error: unknown) {
		return {
			status: "starting",
			timestamp: new Date().toISOString(),
			error: error instanceof Error ? error.message : "Unknown error",
			taxationEvents: readTaxationBootstrapStatus(),
		};
	}
}
