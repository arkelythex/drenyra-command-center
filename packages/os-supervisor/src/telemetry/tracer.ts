/**
 * ARKELYTHEX OS — Singleton tracer provider with graceful fallback.
 *
 * Uses a two-phase initialization:
 * 1. First call to `getOsTracer()` returns a no-op tracer immediately.
 * 2. Registers a real tracer on next microtask (non-blocking).
 * This guarantees `getOsTracer()` never throws at module level.
 */

import {
	DiagConsoleLogger,
	DiagLogLevel,
	diag,
	type Tracer,
	trace,
} from "@opentelemetry/api";
import { version } from "../../package.json" with { type: "json" };
import type { TelemetryConfig } from "./types.js";

let _tracer: Tracer = trace.getTracer("arkelythex-os", "0.0.0");
let _initialized = false;

function defaultConfig(): Required<TelemetryConfig> {
	return {
		serviceName: "arkelythex-os",
		endpoint:
			process.env.OTEL_EXPORTER_OTLP_ENDPOINT ??
			"http://localhost:4318/v1/traces",
		environment: process.env.NODE_ENV ?? "development",
	};
}

async function initProvider(config: TelemetryConfig): Promise<void> {
	if (_initialized) return;
	_initialized = true;

	const cfg = { ...defaultConfig(), ...config };

	if (cfg.environment === "development") {
		diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);
	}

	try {
		const { BasicTracerProvider, ConsoleSpanExporter, SimpleSpanProcessor } =
			await import("@opentelemetry/sdk-trace-base");
		const { Resource } = await import("@opentelemetry/resources");
		const { SemanticResourceAttributes } = await import(
			"@opentelemetry/semantic-conventions"
		);

		const provider = new BasicTracerProvider({
			resource: new Resource({
				[SemanticResourceAttributes.SERVICE_NAME]: cfg.serviceName,
				[SemanticResourceAttributes.SERVICE_VERSION]: version ?? "0.0.0",
				"deployment.environment": cfg.environment,
			}),
		});

		if (cfg.environment === "development") {
			provider.addSpanProcessor(
				new SimpleSpanProcessor(new ConsoleSpanExporter()),
			);
		}

		// Try OTLP exporter
		try {
			const { OTLPTraceExporter } = await import(
				"@opentelemetry/exporter-trace-otlp-http"
			);
			const exporter = new OTLPTraceExporter({ url: cfg.endpoint });
			provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
		} catch {
			diag.warn("OTLP exporter not available — spans only sent to console");
		}

		provider.register();
		_tracer = provider.getTracer(cfg.serviceName, version);
	} catch (error) {
		diag.warn(
			"OpenTelemetry SDK not available — using no-op tracer",
			String(error),
		);
	}
}

/**
 * Get the OS tracer.
 * Returns a no-op tracer immediately; upgrades to real tracer asynchronously.
 */
export function getOsTracer(config?: TelemetryConfig): Tracer {
	if (!_initialized) {
		initProvider(config ?? {}).catch((err) =>
			diag.warn("Telemetry init failed", String(err)),
		);
	}
	return _tracer;
}

/** Force initialization (for setup before running spans) */
export async function ensureTelemetry(config?: TelemetryConfig): Promise<void> {
	await initProvider(config ?? {});
}

/** Reset the tracer (for testing) */
export function resetTracer(): void {
	_tracer = trace.getTracer("arkelythex-os", "0.0.0");
	_initialized = false;
}
