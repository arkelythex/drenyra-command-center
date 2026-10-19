import { loggers } from "../../services/logger";
import type { CircuitBreakerConfig } from "./types";
import { CircuitState } from "./types";

class ProviderCircuit {
	state: CircuitState = CircuitState.CLOSED;
	failureCount = 0;
	successCount = 0;
	lastFailureTime = 0;
	private config: CircuitBreakerConfig;

	constructor(config?: Partial<CircuitBreakerConfig>) {
		this.config = {
			failureThreshold: config?.failureThreshold ?? 5,
			successThreshold: config?.successThreshold ?? 2,
			timeout: config?.timeout ?? 60000,
		};
	}

	recordSuccess(): void {
		this.failureCount = 0;

		if (this.state === CircuitState.HALF_OPEN) {
			this.successCount++;
			if (this.successCount >= this.config.successThreshold) {
				this.state = CircuitState.CLOSED;
				this.successCount = 0;
				loggers.ai.info("Circuit breaker closed", { state: this.state });
			}
		}
	}

	recordFailure(): void {
		this.failureCount++;
		this.lastFailureTime = Date.now();
		this.successCount = 0;

		if (
			this.state === CircuitState.CLOSED &&
			this.failureCount >= this.config.failureThreshold
		) {
			this.state = CircuitState.OPEN;
			loggers.ai.warn("Circuit breaker opened", {
				failures: this.failureCount,
			});
		}
	}

	canExecute(): boolean {
		if (this.state === CircuitState.CLOSED) {
			return true;
		}

		if (this.state === CircuitState.OPEN) {
			if (Date.now() - this.lastFailureTime >= this.config.timeout) {
				this.state = CircuitState.HALF_OPEN;
				this.successCount = 0;
				loggers.ai.info("Circuit breaker half-open", {
					timeout: this.config.timeout,
				});
				return true;
			}
			return false;
		}

		return true;
	}

	getState(): CircuitState {
		return this.state;
	}
}

export { ProviderCircuit };
