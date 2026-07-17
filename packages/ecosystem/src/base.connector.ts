import type {
	ConnectorHealth,
	ConnectorMetrics,
	ConnectorPort,
} from "./connector.port";

/**
 * BaseConnector — abstract base class for ecosystem connectors.
 *
 * Provides:
 * - Circuit breaker state tracking with exponential backoff recovery
 * - Operation metrics (total, errors, last timestamp)
 * - Health check scaffolding with timeout
 * - Connection state management
 * - Auto-remediation: health-driven recovery + transient retry
 */
export abstract class BaseConnector<
	TConfig = Record<string, unknown>,
	TOperation = string,
> implements ConnectorPort<TConfig, ConnectorHealth, TOperation>
{
	abstract readonly name: string;
	abstract readonly config: TConfig;

	protected state:
		| "disconnected"
		| "connecting"
		| "connected"
		| "degraded"
		| "error" = "disconnected";

	/** Circuit breaker state */
	protected circuitState: "closed" | "open" | "half-open" = "closed";
	protected consecutiveFailures = 0;
	protected lastFailureTime = 0;
	protected readonly failureThreshold = 5;

	/** Exponential backoff recovery */
	protected baseRecoveryMs = 10_000;
	protected maxRecoveryMs = 300_000;
	protected recoveryAttempts = 0;

	protected get currentRecoveryMs(): number {
		const delay = this.baseRecoveryMs * 2 ** this.recoveryAttempts;
		return Math.min(delay, this.maxRecoveryMs);
	}

	/** @deprecated Use currentRecoveryMs instead */
	protected get recoveryTimeoutMs(): number {
		return this.currentRecoveryMs;
	}

	/** Metrics */
	protected operationsTotal = 0;
	protected errorsTotal = 0;
	protected lastOperationAt: string | null = null;
	protected healthCheckTimeoutMs = 5_000;

	abstract connect(): Promise<void>;
	abstract disconnect(): Promise<void>;
	abstract execute<TResult>(
		operation: TOperation,
		...args: unknown[]
	): Promise<TResult>;

	async isHealthy(): Promise<ConnectorHealth> {
		const start = performance.now();
		try {
			const result = await this.performHealthCheck();
			const latencyMs = performance.now() - start;

			if (result && this.circuitState === "open") {
				await this.checkAndRecover();
			}

			return {
				connected: result,
				latencyMs: Math.round(latencyMs),
				errorRate:
					this.operationsTotal > 0
						? this.errorsTotal / this.operationsTotal
						: 0,
				status: result ? "healthy" : "unhealthy",
				lastChecked: new Date().toISOString(),
			};
		} catch (err) {
			const latencyMs = performance.now() - start;
			return {
				connected: false,
				latencyMs: Math.round(latencyMs),
				errorRate: 1,
				status: `error: ${(err as Error).message}`,
				lastChecked: new Date().toISOString(),
			};
		}
	}

	/**
	 * Attempt health-driven auto-recovery when the circuit is open
	 * and enough backoff time has elapsed.
	 */
	protected async checkAndRecover(): Promise<void> {
		if (this.circuitState !== "open") return;

		const timeSinceFailure = Date.now() - this.lastFailureTime;
		if (timeSinceFailure < this.currentRecoveryMs) return;

		this.circuitState = "half-open";
		const healthy = await this.performHealthCheck();

		if (healthy) {
			this.circuitState = "closed";
			this.consecutiveFailures = 0;
			this.recoveryAttempts = 0;
			this.state = "connected";
			await this.onRecovered();
		} else {
			this.recoveryAttempts++;
			this.circuitState = "open";
			this.lastFailureTime = Date.now();
		}
	}

	/**
	 * Lifecycle hook called after successful auto-recovery.
	 * Subclasses can override to log, notify, or replay queued operations.
	 */
	protected async onRecovered(): Promise<void> {}

	/**
	 * Subclasses override this to define what "healthy" means.
	 * Default implementation returns true if state is "connected".
	 */
	protected async performHealthCheck(): Promise<boolean> {
		return this.state === "connected";
	}

	getMetrics(): ConnectorMetrics {
		return {
			name: this.name,
			state: this.state,
			operationsTotal: this.operationsTotal,
			errorsTotal: this.errorsTotal,
			lastOperationAt: this.lastOperationAt,
			circuitBreakerState: this.circuitState,
		};
	}

	/**
	 * Reset all runtime counters and close the circuit breaker.
	 * Does NOT change connection state.
	 */
	resetMetrics(): void {
		this.operationsTotal = 0;
		this.errorsTotal = 0;
		this.consecutiveFailures = 0;
		this.recoveryAttempts = 0;
		this.lastOperationAt = null;
		this.circuitState = "closed";
	}

	/**
	 * Call this wrapper inside execute() to get:
	 * - Health-driven auto-recovery (checkAndRecover)
	 * - Circuit breaker guard
	 * - Metrics tracking
	 * - One auto-retry for transient errors
	 */
	protected async guardedExecute<T>(fn: () => Promise<T>): Promise<T> {
		await this.checkAndRecover();

		if (this.circuitState === "open") {
			throw new CircuitBreakerOpenError(this.name, this.currentRecoveryMs);
		}

		try {
			const result = await fn();
			this.onSuccess();
			return result;
		} catch (err) {
			this.onFailure();

			if (this.consecutiveFailures < 3) {
				await new Promise((r) =>
					setTimeout(r, 1000 * this.consecutiveFailures),
				);
				try {
					const result = await fn();
					this.onSuccess();
					return result;
				} catch (retryErr) {
					this.onFailure();
					throw retryErr;
				}
			}
			throw err;
		}
	}

	private onSuccess(): void {
		this.consecutiveFailures = 0;
		this.recoveryAttempts = 0;
		this.circuitState = "closed";
		this.operationsTotal++;
		this.lastOperationAt = new Date().toISOString();
	}

	private onFailure(): void {
		this.consecutiveFailures++;
		this.errorsTotal++;
		this.lastOperationAt = new Date().toISOString();

		if (this.consecutiveFailures >= this.failureThreshold) {
			this.circuitState = "open";
			this.lastFailureTime = Date.now();
		}
	}
}

export class CircuitBreakerOpenError extends Error {
	constructor(
		public readonly connectorName: string,
		public readonly retryAfterMs: number,
	) {
		super(
			`Circuit breaker OPEN for connector "${connectorName}". Retry in ${retryAfterMs}ms`,
		);
		this.name = "CircuitBreakerOpenError";
	}
}
