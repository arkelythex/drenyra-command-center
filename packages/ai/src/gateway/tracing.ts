/**
 * LLM Gateway - OpenTelemetry Tracing
 *
 * Provides OpenTelemetry tracing for LLM Gateway operations.
 * Integrates with @elysiajs/opentelemetry when available.
 *
 * @module @arkelythex/ai/gateway
 */

import type { LLMProvider } from "./types";

/**
 * Span attributes for LLM Gateway operations.
 */
export interface LLMGatewaySpanAttributes {
	// Request attributes
	"llm.request.id"?: string;
	"llm.request.model"?: string;
	"llm.request.provider"?: string;
	"llm.request.organization_id"?: number;
	"llm.request.user_id"?: string;

	// Response attributes
	"llm.response.id"?: string;
	"llm.response.model"?: string;
	"llm.response.provider"?: string;

	// Token usage
	"llm.usage.prompt_tokens"?: number;
	"llm.usage.completion_tokens"?: number;
	"llm.usage.total_tokens"?: number;

	// Cost
	"llm.cost.usd"?: number;

	// Timing
	"llm.latency.ms"?: number;

	// Error
	error?: boolean;
	"error.code"?: string;
	"error.message"?: string;
}

/**
 * Interface for tracing spans.
 */
export interface LLMSpan {
	/**
	 * Set an attribute on the span.
	 */
	setAttribute(key: string, value: unknown): void;

	/**
	 * Add an event to the span.
	 */
	addEvent(name: string, attributes?: Record<string, unknown>): void;

	/**
	 * End the span.
	 */
	end(attributes?: LLMGatewaySpanAttributes): void;

	/**
	 * Record an exception.
	 */
	recordException(error: Error): void;
}

/**
 * No-op span implementation.
 */
class NoOpSpan implements LLMSpan {
	setAttribute(_key: string, _value: unknown): void {
		// No-op
	}

	addEvent(_name: string, _attributes?: Record<string, unknown>): void {
		// No-op
	}

	end(_attributes?: LLMGatewaySpanAttributes): void {
		// No-op
	}

	recordException(_error: Error): void {
		// No-op
	}
}

/**
 * Console span for development logging.
 */
class ConsoleSpan implements LLMSpan {
	private name: string;
	private attributes: Record<string, unknown>;
	private startTime: number;

	constructor(name: string, attributes: Record<string, unknown> = {}) {
		this.name = name;
		this.attributes = attributes;
		this.startTime = Date.now();
	}

	setAttribute(key: string, value: unknown): void {
		this.attributes[key] = value;
	}

	addEvent(name: string, eventAttributes?: Record<string, unknown>): void {
		console.log(
			`[LLM Gateway Tracing] ${this.name}:event:${name}`,
			eventAttributes ?? "",
		);
	}

	end(endAttributes?: LLMGatewaySpanAttributes): void {
		const duration = Date.now() - this.startTime;
		console.log(`[LLM Gateway Tracing] ${this.name}:end`, {
			...this.attributes,
			...endAttributes,
			"llm.latency.ms": duration,
		});
	}

	recordException(error: Error): void {
		console.error(`[LLM Gateway Tracing] ${this.name}:error`, {
			...this.attributes,
			error: error.message,
			stack: error.stack,
		});
	}
}

/**
 * Tracing service for LLM Gateway.
 *
 * Provides tracing capabilities when OpenTelemetry is available,
 * falls back to no-op when not available.
 */
export class LLMGatewayTracer {
	private isEnabled: boolean = false;

	constructor() {
		this.detectOpenTelemetry();
	}

	/**
	 * Detect if OpenTelemetry is available.
	 */
	private detectOpenTelemetry(): void {
		try {
			// Check if we're in an environment with OpenTelemetry
			// The actual tracing will be done by @elysiajs/opentelemetry
			this.isEnabled = process.env.ARKELYTHEX_ENABLE_OTEL === "true";
		} catch {
			this.isEnabled = false;
		}
	}

	/**
	 * Check if tracing is enabled.
	 */
	isTracingEnabled(): boolean {
		return this.isEnabled;
	}

	/**
	 * Start a span for a chat request.
	 */
	startChatSpan(attributes: LLMGatewaySpanAttributes): LLMSpan {
		if (!this.isEnabled) {
			return new NoOpSpan();
		}

		// Return a span that logs to console in development
		// In production with @elysiajs/opentelemetry, this would create actual spans
		return new ConsoleSpan("chat", attributes as Record<string, unknown>);
	}

	/**
	 * Start a span for streaming.
	 */
	startStreamSpan(attributes: LLMGatewaySpanAttributes): LLMSpan {
		if (!this.isEnabled) {
			return new NoOpSpan();
		}

		return new ConsoleSpan("stream", attributes as Record<string, unknown>);
	}

	/**
	 * Start a span for provider fallback.
	 */
	startFallbackSpan(provider: LLMProvider, attempt: number): LLMSpan {
		if (!this.isEnabled) {
			return new NoOpSpan();
		}

		return new ConsoleSpan(`fallback.${attempt}`, {
			"llm.request.provider": provider,
		});
	}
}

/**
 * Default tracer instance.
 */
export const llmGatewayTracer = new LLMGatewayTracer();
