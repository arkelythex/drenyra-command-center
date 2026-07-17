import type { ConnectorHealth } from "./connector.port";
import { getConnectorRegistry } from "./connector.registry";

/**
 * Aggregate health check across all registered ecosystem connectors.
 * Returns a summary suitable for the API health endpoint.
 */
export async function aggregateHealth(): Promise<{
	summary: "all_healthy" | "partial" | "all_down";
	total: number;
	healthy: number;
	degraded: number;
	connectors: Record<string, ConnectorHealth>;
}> {
	const registry = getConnectorRegistry();
	const results = await registry.healthCheck();
	const connectors: Record<string, ConnectorHealth> = {};

	let healthy = 0;
	let degraded = 0;

	for (const [name, result] of Object.entries(results)) {
		if (result.healthy) {
			connectors[name] = result.health as ConnectorHealth;
			healthy++;
		} else {
			connectors[name] = {
				connected: false,
				latencyMs: 0,
				errorRate: 1,
				status: result.error ?? "unknown",
				lastChecked: new Date().toISOString(),
			};
			degraded++;
		}
	}

	const total = healthy + degraded;
	const summary =
		total === 0
			? "all_down"
			: degraded === 0
				? "all_healthy"
				: healthy > 0
					? "partial"
					: "all_down";

	return { summary, total, healthy, degraded, connectors };
}
