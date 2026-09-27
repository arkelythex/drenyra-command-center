const DEFAULT_CONFIG = {
    maxRuns: 5,
    maxSummaryLength: 500,
};
export class MemoryContextProvider {
    sessionStore;
    config;
    constructor(sessionStore, config = {}) {
        this.sessionStore = sessionStore;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    async getContext(companyId) {
        const runs = await this.sessionStore.listRunStates({
            companyId,
            status: "completed",
            limit: this.config.maxRuns,
        });
        if (runs.length === 0)
            return null;
        const summaries = runs
            .map((r, i) => this.formatRunSummary(r, i + 1))
            .filter(Boolean)
            .join("\n\n");
        return {
            summary: summaries,
            recentRuns: runs.length,
            companyId,
        };
    }
    formatRunSummary(run, index) {
        const context = run.context ?? {};
        const memorySummary = context.memorySummary;
        const inputType = context.inputType ?? "unknown";
        const workflowState = run.workflowState ?? "unknown";
        const date = run.completedAt
            ? new Date(run.completedAt).toISOString().split("T")[0]
            : "unknown";
        let summary = memorySummary ??
            `Run #${run.runId.slice(0, 8)} — ${inputType} — ${workflowState} — ${date}`;
        if (summary.length > this.config.maxSummaryLength) {
            summary = `${summary.slice(0, this.config.maxSummaryLength)}...`;
        }
        return `[Past Run ${index}]\n${summary}`;
    }
}
//# sourceMappingURL=memory-context.js.map