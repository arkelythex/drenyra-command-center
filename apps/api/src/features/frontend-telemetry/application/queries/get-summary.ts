/**
 * GetTelemetrySummaryQuery — Returns the frontend telemetry summary from the service.
 *
 * @module frontend-telemetry/application/queries
 */

import { FrontendTelemetryService } from "../../../../services/frontend-telemetry.service";

/**
 * Returns the current frontend telemetry summary counters.
 *
 * @returns The service summary object
 *
 * @example
 * ```ts
 * const summary = getTelemetrySummary();
 * ```
 */
export function getTelemetrySummary() {
	return FrontendTelemetryService.getSummary();
}
