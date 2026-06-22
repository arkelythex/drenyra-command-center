/**
 * Error Recovery Module — Barrel Export
 *
 * @module ai/services/error-recovery
 */

export {
	AgentError,
	TimeoutError,
	RateLimitError,
	NetworkError,
	ProviderError,
	ValidationError,
	InvalidInputError,
	FiscalViolationError,
	classifyError,
} from "./agent-error";

export { PersistentCircuitBreaker } from "./persistent-circuit-breaker";
export type { CBState } from "./persistent-circuit-breaker";

export { RetryEngine } from "./retry-engine";
export type { RetryConfig } from "./retry-engine";
