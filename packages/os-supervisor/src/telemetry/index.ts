/**
 * ARKELYTHEX OS — Telemetry module.
 *
 * Provides OpenTelemetry tracing for OS components with graceful fallback
 * when the OTel SDK or exporter is not installed.
 */

export {
	traceAgentExecution,
	traceApproval,
	traceRagQuery,
	traceSupervisor,
} from "./operations.js";
export { getOsTracer, resetTracer } from "./tracer.js";
export type { OSSpanAttributes, TelemetryConfig } from "./types.js";
