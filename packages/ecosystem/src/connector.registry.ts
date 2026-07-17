import type { ConnectorMetrics, ConnectorPort } from "./connector.port";

/**
 * ConnectorRegistry — lifecycle manager for all ecosystem integrations.
 *
 * Handles:
 * - Registration/deregistration of connectors
 * - Aggregate health checks across all connectors
 * - Connection lifecycle (connect all, disconnect all)
 * - Metrics collection
 */
export class ConnectorRegistry {
	private readonly connectors = new Map<string, ConnectorPort>();
	private readonly metrics = new Map<string, ConnectorMetrics>();

	register(connector: ConnectorPort): void {
		if (this.connectors.has(connector.name)) {
			throw new Error(`Connector "${connector.name}" is already registered`);
		}
		this.connectors.set(connector.name, connector);
		this.metrics.set(connector.name, {
			name: connector.name,
			state: "disconnected",
			operationsTotal: 0,
			errorsTotal: 0,
			lastOperationAt: null,
			circuitBreakerState: "closed",
		});
	}

	unregister(name: string): void {
		this.connectors.delete(name);
		this.metrics.delete(name);
	}

	get<T extends ConnectorPort>(name: string): T | undefined {
		return this.connectors.get(name) as T | undefined;
	}

	getAll(): ConnectorPort[] {
		return Array.from(this.connectors.values());
	}

	getNames(): string[] {
		return Array.from(this.connectors.keys());
	}

	async connectAll(): Promise<void> {
		const results = await Promise.allSettled(
			Array.from(this.connectors.values()).map(async (c) => {
				await c.connect();
				this.metrics.get(c.name)!.state = "connected";
			}),
		);
		for (const result of results) {
			if (result.status === "rejected") {
				console.error("Connector failed to connect:", result.reason);
			}
		}
	}

	async disconnectAll(): Promise<void> {
		await Promise.allSettled(
			Array.from(this.connectors.values()).map(async (c) => {
				await c.disconnect();
				this.metrics.get(c.name)!.state = "disconnected";
			}),
		);
	}

	async healthCheck(): Promise<Record<string, ConnectorHealthResult>> {
		const checks: Array<[string, Promise<ConnectorHealthResult>]> = [];

		for (const [name, connector] of this.connectors) {
			checks.push([
				name,
				connector
					.isHealthy()
					.then((h) => ({ healthy: true, health: h }) as ConnectorHealthResult)
					.catch(
						(err) =>
							({ healthy: false, error: err.message }) as ConnectorHealthResult,
					),
			]);
		}

		const results: Record<string, ConnectorHealthResult> = {};
		for (const [name, promise] of checks) {
			results[name] = await promise;
		}
		return results;
	}

	getMetrics(): ConnectorMetrics[] {
		return Array.from(this.metrics.values());
	}

	recordOperation(name: string, error: boolean): void {
		const m = this.metrics.get(name);
		if (m) {
			m.operationsTotal++;
			if (error) m.errorsTotal++;
			m.lastOperationAt = new Date().toISOString();
		}
	}

	size(): number {
		return this.connectors.size;
	}
}

export interface ConnectorHealthResult {
	healthy: boolean;
	health?: unknown;
	error?: string;
}

/** Global singleton registry */
let globalRegistry: ConnectorRegistry | null = null;

export function getConnectorRegistry(): ConnectorRegistry {
	if (!globalRegistry) {
		globalRegistry = new ConnectorRegistry();
	}
	return globalRegistry;
}

export function resetConnectorRegistry(): void {
	globalRegistry = null;
}
