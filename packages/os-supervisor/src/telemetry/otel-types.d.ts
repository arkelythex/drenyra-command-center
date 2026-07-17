// Type declarations for optional OpenTelemetry SDK packages
// These are dynamically imported in telemetry/tracer.ts and only needed
// when OpenTelemetry is configured. The try-catch handles runtime failures.
declare module "@opentelemetry/sdk-trace-base" {
	export class BasicTracerProvider {
		constructor(config?: Record<string, unknown>);
		addSpanProcessor(processor: unknown): void;
		register(): void;
		getTracer(
			name: string,
			version?: string,
		): import("@opentelemetry/api").Tracer;
	}
	export class ConsoleSpanExporter {}
	export class SimpleSpanProcessor {
		constructor(exporter: unknown);
	}
}
declare module "@opentelemetry/resources" {
	export class Resource {
		constructor(attributes: Record<string, string>);
	}
}
declare module "@opentelemetry/semantic-conventions" {
	export const SemanticResourceAttributes: Record<string, string>;
}
declare module "@opentelemetry/exporter-trace-otlp-http" {
	export class OTLPTraceExporter {
		constructor(config?: { url?: string });
	}
}
