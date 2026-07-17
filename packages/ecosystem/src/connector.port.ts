/**
 * ConnectorPort interface — canonical contract for all ecosystem integrations.
 *
 * Every external tool (ERPNext, DuckDB, Docling, N8N, Dify, Temporal, etc.)
 * MUST implement this interface through a connector adapter.
 *
 * @typeParam TConfig — connector-specific configuration shape
 * @typeParam THealth — connector-specific health status shape
 * @typeParam TOperation — discriminated union of supported operations
 */

export interface ConnectorPort<
	TConfig = Record<string, unknown>,
	THealth = ConnectorHealth,
	TOperation = string,
> {
	/** Unique connector name (e.g. "erpnext", "duckdb") */
	readonly name: string;

	/** Runtime configuration */
	readonly config: TConfig;

	/** Establish connection to the external system */
	connect(): Promise<void>;

	/** Gracefully tear down the connection */
	disconnect(): Promise<void>;

	/** Returns health status including latency and error rate */
	isHealthy(): Promise<THealth>;

	/**
	 * Execute a typed operation against the external system.
	 * Operations are connector-specific discriminated unions.
	 */
	execute<TResult = unknown>(
		operation: TOperation,
		...args: unknown[]
	): Promise<TResult>;
}

export interface ConnectorHealth {
	/** true if the connector can serve requests */
	connected: boolean;
	/** Latency of last health check in ms */
	latencyMs: number;
	/** Error rate over last 100 operations (0..1) */
	errorRate: number;
	/** Human-readable status message */
	status: string;
	/** ISO 8601 timestamp of last successful check */
	lastChecked: string;
}

export type ConnectorState =
	| "disconnected"
	| "connecting"
	| "connected"
	| "degraded"
	| "error";

export interface ConnectorMetrics {
	name: string;
	state: ConnectorState;
	operationsTotal: number;
	errorsTotal: number;
	lastOperationAt: string | null;
	circuitBreakerState: "closed" | "open" | "half-open";
}
