/**
 * OpenTelemetry runtime readiness states for API instrumentation.
 *
 * @example
 * ```ts
 * const status: OpenTelemetryReadinessStatus = "ready";
 * ```
 */
export type OpenTelemetryReadinessStatus =
	| "disabled"
	| "ready"
	| "config_invalid";

/**
 * Normalized OpenTelemetry readiness payload for health endpoints.
 *
 * @example
 * ```ts
 * const readiness: OpenTelemetryReadiness = getOpenTelemetryReadinessStatus();
 * ```
 */
export type OpenTelemetryReadiness = {
	status: OpenTelemetryReadinessStatus;
	enabled: boolean;
	serviceName: string;
	exporterEndpoint: string | null;
	usingDefaultServiceName: boolean;
};

function isTruthy(value: string | undefined): boolean {
	return value === "1" || value?.toLowerCase() === "true";
}

/**
 * Reads OpenTelemetry environment flags and returns readiness state.
 *
 * @returns OpenTelemetry readiness information for operational checks
 * @example
 * ```ts
 * const readiness = getOpenTelemetryReadinessStatus();
 * ```
 */
export function getOpenTelemetryReadinessStatus(): OpenTelemetryReadiness {
	const enabled = isTruthy(process.env.DRENYRA_ENABLE_OTEL);
	const rawServiceName = process.env.OTEL_SERVICE_NAME?.trim() ?? "";
	const serviceName = rawServiceName || "drenyra-api";
	const exporterEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim() || null;

	if (!enabled) {
		return {
			status: "disabled",
			enabled: false,
			serviceName,
			exporterEndpoint,
			usingDefaultServiceName: rawServiceName.length === 0,
		};
	}

	if (!exporterEndpoint) {
		return {
			status: "config_invalid",
			enabled: true,
			serviceName,
			exporterEndpoint: null,
			usingDefaultServiceName: rawServiceName.length === 0,
		};
	}

	return {
		status: "ready",
		enabled: true,
		serviceName,
		exporterEndpoint,
		usingDefaultServiceName: rawServiceName.length === 0,
	};
}
