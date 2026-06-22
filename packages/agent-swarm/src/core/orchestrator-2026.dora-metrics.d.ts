export declare class DoraMetrics {
    private metrics;
    recordDeployment(success: boolean, leadTimeMinutes: number): void;
    recordRecovery(timeToRecoveryMinutes: number): void;
    getMetrics(): {
        deploymentFrequency: {
            daily: number;
            weekly: number;
        };
        leadTimeForChanges: {
            avg: number;
            median: number;
        };
        changeFailureRate: number;
        meanTimeToRecovery: {
            avg: number;
        };
    };
    private calculateMedian;
}
//# sourceMappingURL=orchestrator-2026.dora-metrics.d.ts.map