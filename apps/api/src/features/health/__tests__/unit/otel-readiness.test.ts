import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getOpenTelemetryReadinessStatus } from "../../otel-readiness.ts";

describe("getOpenTelemetryReadinessStatus", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		process.env = { ...originalEnv };
		delete process.env.DRENYRA_ENABLE_OTEL;
		delete process.env.OTEL_SERVICE_NAME;
		delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("reports disabled when tracing is not enabled", () => {
		expect(getOpenTelemetryReadinessStatus()).toEqual({
			status: "disabled",
			enabled: false,
			serviceName: "drenyra-api",
			exporterEndpoint: null,
			usingDefaultServiceName: true,
		});
	});

	it("reports config_invalid when tracing is enabled without an exporter endpoint", () => {
		process.env.DRENYRA_ENABLE_OTEL = "true";

		expect(getOpenTelemetryReadinessStatus()).toEqual({
			status: "config_invalid",
			enabled: true,
			serviceName: "drenyra-api",
			exporterEndpoint: null,
			usingDefaultServiceName: true,
		});
	});

	it("reports ready when tracing is enabled with an OTLP endpoint", () => {
		process.env.DRENYRA_ENABLE_OTEL = "1";
		process.env.OTEL_SERVICE_NAME = "drenyra-api-prod";
		process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "https://otlp.grafana.net/otlp";

		expect(getOpenTelemetryReadinessStatus()).toEqual({
			status: "ready",
			enabled: true,
			serviceName: "drenyra-api-prod",
			exporterEndpoint: "https://otlp.grafana.net/otlp",
			usingDefaultServiceName: false,
		});
	});
});
