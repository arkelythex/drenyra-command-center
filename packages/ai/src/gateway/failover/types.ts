import type { FailoverAttempt, LLMProvider } from "../types";
import { LLMGatewayError } from "../types";

export { type FailoverAttempt, LLMGatewayError, type LLMProvider };

export enum CircuitState {
	CLOSED = "closed",
	OPEN = "open",
	HALF_OPEN = "half_open",
}

export interface CircuitBreakerConfig {
	failureThreshold: number;
	successThreshold: number;
	timeout: number;
}

export interface FailoverChain {
	primary: LLMProvider;
	fallbacks: LLMProvider[];
	maxRetries: number;
	retryDelayMs: number;
}

export interface ProviderHealth {
	provider: LLMProvider;
	isHealthy: boolean;
	circuitState: CircuitState;
	successRate: number;
	totalRequests: number;
	failedRequests: number;
	avgLatencyMs: number;
	lastUsed?: Date;
}
