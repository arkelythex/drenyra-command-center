/**
 * GetRecentTelemetryQuery — Returns recent frontend telemetry events.
 *
 * @module frontend-telemetry/application/queries
 */

import { FrontendTelemetryService } from "../../../../services/frontend-telemetry.service";

export interface GetRecentTelemetryInput {
	limit: number;
}

export interface GetRecentTelemetryResult {
	items: unknown[];
	limit: number;
}

/**
 * Returns recent frontend telemetry events.
 *
 * @param input - The query with limit parameter
 * @returns The recent events with the applied limit
 *
 * @example
 * ```ts
 * const result = await getRecentTelemetry({ limit: 20 });
 * ```
 */
export async function getRecentTelemetry(
	input: GetRecentTelemetryInput,
): Promise<GetRecentTelemetryResult> {
	const items = FrontendTelemetryService.getRecent(input.limit);
	return { items, limit: input.limit };
}
