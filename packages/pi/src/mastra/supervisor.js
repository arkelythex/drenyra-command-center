export class Supervisor {
    timings = [];
    resolveConflicts(conflicts, strategy = "highest-confidence") {
        return conflicts.map((conflict) => {
            switch (strategy) {
                case "highest-confidence": {
                    return {
                        ...conflict,
                        resolvedBy: conflict.resolvedBy,
                    };
                }
                case "latest": {
                    return {
                        ...conflict,
                        resolvedBy: "latest-timestamp",
                    };
                }
                default: {
                    return {
                        ...conflict,
                        resolvedBy: "default-strategy",
                    };
                }
            }
        });
    }
    canProceed(results) {
        const failures = results.filter((r) => r.status === "error" || r.status === "timeout");
        if (failures.length > results.length / 2) {
            return {
                proceed: false,
                reason: `Too many failures: ${failures.length}/${results.length} domains failed`,
            };
        }
        return { proceed: true };
    }
    recordTiming(domain, startedAt, completedAt) {
        this.timings.push({
            domain,
            startedAt,
            completedAt,
            durationMs: completedAt.getTime() - startedAt.getTime(),
        });
    }
    getTimings() {
        return [...this.timings];
    }
    getPerformanceSummary() {
        const sorted = [...this.timings].sort((a, b) => b.durationMs - a.durationMs);
        return {
            totalDurationMs: this.timings.reduce((sum, t) => sum + t.durationMs, 0),
            totalPhases: this.timings.length,
            slowest: sorted[0],
            fastest: sorted[sorted.length - 1],
        };
    }
}
//# sourceMappingURL=supervisor.js.map