import { AgentMetricsCollector } from "./collector";

export interface DoraMetrics {
	deploymentFrequency: number;
	leadTimeForChanges: number;
	meanTimeToRecovery: number;
	changeFailureRate: number;
}

export class DoraMetricsCollector {
	private deployments: Array<{
		timestamp: number;
		success: boolean;
		leadTimeMinutes: number;
	}> = [];
	private failures: Array<{ timestamp: number; recoveryTimeMinutes: number }> =
		[];

	recordDeployment(success: boolean, leadTimeMinutes: number): void {
		this.deployments.push({
			timestamp: Date.now(),
			success,
			leadTimeMinutes,
		});

		const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
		this.deployments = this.deployments.filter((d) => d.timestamp >= cutoff);
	}

	recordFailureRecovery(recoveryTimeMinutes: number): void {
		this.failures.push({
			timestamp: Date.now(),
			recoveryTimeMinutes,
		});

		const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
		this.failures = this.failures.filter((f) => f.timestamp >= cutoff);
	}

	getMetrics(): DoraMetrics {
		const now = Date.now();
		const dayWindow = 24 * 60 * 60 * 1000;
		const weekWindow = 7 * dayWindow;

		const recentDeployments = this.deployments.filter(
			(d) => d.timestamp >= now - weekWindow,
		);
		const deploymentFrequency = recentDeployments.length / 7;

		const leadTimes = recentDeployments
			.map((d) => d.leadTimeMinutes)
			.sort((a, b) => a - b);
		const leadTimeForChanges =
			leadTimes.length > 0 ? leadTimes[Math.floor(leadTimes.length / 2)] : 0;

		const recentFailures = this.failures.filter(
			(f) => f.timestamp >= now - weekWindow,
		);
		const meanTimeToRecovery =
			recentFailures.length > 0
				? recentFailures.reduce((sum, f) => sum + f.recoveryTimeMinutes, 0) /
					recentFailures.length
				: 0;

		const successfulDeployments = recentDeployments.filter(
			(d) => d.success,
		).length;
		const changeFailureRate =
			recentDeployments.length > 0
				? ((recentDeployments.length - successfulDeployments) /
						recentDeployments.length) *
					100
				: 0;

		return {
			deploymentFrequency,
			leadTimeForChanges,
			meanTimeToRecovery,
			changeFailureRate,
		};
	}
}

let globalMetricsCollector: AgentMetricsCollector | null = null;

export function getAgentMetricsCollector(): AgentMetricsCollector {
	if (!globalMetricsCollector) {
		globalMetricsCollector = new AgentMetricsCollector();
	}
	return globalMetricsCollector;
}

let globalDoraMetricsCollector: DoraMetricsCollector | null = null;

export function getDoraMetricsCollector(): DoraMetricsCollector {
	if (!globalDoraMetricsCollector) {
		globalDoraMetricsCollector = new DoraMetricsCollector();
	}
	return globalDoraMetricsCollector;
}
