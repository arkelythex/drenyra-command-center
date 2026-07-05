/**
 * Error Recovery Module — Barrel Export
 *
 * @module ai/services/error-recovery
 */

export {
	AgentError,
	classifyError,
	FiscalViolationError,
	InvalidInputError,
	NetworkError,
	ProviderError,
	RateLimitError,
	TimeoutError,
	ValidationError,
} from "./agent-error";
export type { CBState } from "./persistent-circuit-breaker";
export { PersistentCircuitBreaker } from "./persistent-circuit-breaker";
export type { RetryConfig } from "./retry-engine";
export { RetryEngine } from "./retry-engine";
