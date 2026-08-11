/**
 * RecordTelemetryCommand — Records a frontend telemetry event.
 *
 * Extracted from inline route handler for CQRS compliance.
 * Delegates to FrontendTelemetryService for actual persistence.
 *
 * @module frontend-telemetry/application/commands
 */

import {
	type FrontendTelemetryInput,
	type FrontendTelemetryRating,
	FrontendTelemetryService,
} from "../../../../services/frontend-telemetry.service";

export interface RecordTelemetryInput {
	kind: string;
	name?: string;
	path?: string;
	value?: number;
	rating?: string;
	message?: string;
	stack?: string;
	context?: Record<string, unknown>;
	timestamp: string;
	userAgent?: string | null;
	ipAddress?: string | null;
}

export interface RecordTelemetryResult {
	accepted: boolean;
	id: string;
}

/**
 * Records a frontend telemetry event.
 *
 * @param input - The telemetry event data
 * @returns The recording result with the event ID
 * @throws If the service fails to record the event
 *
 * @example
 * ```ts
 * const result = await recordTelemetry({
 *   kind: 'pageview',
 *   path: '/dashboard',
 *   timestamp: new Date().toISOString(),
 * });
 * ```
 */
export async function recordTelemetry(
	input: RecordTelemetryInput,
): Promise<RecordTelemetryResult> {
	const serviceInput: FrontendTelemetryInput = {
		kind: input.kind as FrontendTelemetryInput["kind"],
		...(input.name !== undefined ? { name: input.name } : {}),
		...(input.path !== undefined ? { path: input.path } : {}),
		...(input.value !== undefined ? { value: input.value } : {}),
		...(input.rating !== undefined
			? { rating: input.rating as FrontendTelemetryRating }
			: {}),
		...(input.message !== undefined ? { message: input.message } : {}),
		...(input.stack !== undefined ? { stack: input.stack } : {}),
		...(input.context !== undefined ? { context: input.context } : {}),
		timestamp: input.timestamp,
		userAgent: input.userAgent ?? null,
		ipAddress: input.ipAddress ?? null,
	};

	const entry = await FrontendTelemetryService.record(serviceInput);
	return {
		accepted: true,
		id: entry.id,
	};
}
