export class DoraMetrics {
    metrics = {
        deploymentFrequency: [],
        leadTimeForChanges: [],
        changeFailureRate: { total: 0, failed: 0 },
        meanTimeToRecovery: [],
    };
    recordDeployment(success, leadTimeMinutes) {
        this.metrics.deploymentFrequency.push(new Date());
        this.metrics.leadTimeForChanges.push(leadTimeMinutes);
        this.metrics.changeFailureRate.total++;
        if (!success)
            this.metrics.changeFailureRate.failed++;
    }
    recordRecovery(timeToRecoveryMinutes) {
        this.metrics.meanTimeToRecovery.push(timeToRecoveryMinutes);
    }
    getMetrics() {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        return {
            deploymentFrequency: {
                daily: this.metrics.deploymentFrequency.filter((d) => d > oneDayAgo)
                    .length,
                weekly: this.metrics.deploymentFrequency.filter((d) => d > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)).length,
            },
            leadTimeForChanges: {
                avg: this.metrics.leadTimeForChanges.length > 0
                    ? this.metrics.leadTimeForChanges.reduce((a, b) => a + b, 0) /
                        this.metrics.leadTimeForChanges.length
                    : 0,
                median: this.calculateMedian(this.metrics.leadTimeForChanges),
            },
            changeFailureRate: this.metrics.changeFailureRate.total > 0
                ? (this.metrics.changeFailureRate.failed /
                    this.metrics.changeFailureRate.total) *
                    100
                : 0,
            meanTimeToRecovery: {
                avg: this.metrics.meanTimeToRecovery.length > 0
                    ? this.metrics.meanTimeToRecovery.reduce((a, b) => a + b, 0) /
                        this.metrics.meanTimeToRecovery.length
                    : 0,
            },
        };
    }
    calculateMedian(arr) {
        if (arr.length === 0)
            return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0
            ? sorted[mid]
            : (sorted[mid - 1] + sorted[mid]) / 2;
    }
}
//# sourceMappingURL=orchestrator-2026.dora-metrics.js.map