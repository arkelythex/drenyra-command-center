export const DRENYRA_PERF_BUDGETS = [
    { name: "command_palette_open", category: "perception", targetMs: 100, warningMs: 80, description: "Command palette opens" },
    { name: "pane_switch", category: "perception", targetMs: 50, warningMs: 30, description: "Switch between loaded panes" },
    { name: "click_response", category: "perception", targetMs: 100, warningMs: 70, description: "Visual response to click/tap" },
    { name: "workspace_restore", category: "loading", targetMs: 300, warningMs: 200, description: "Workspace state restoration" },
    { name: "layout_restore", category: "loading", targetMs: 200, warningMs: 150, description: "Layout persistence restore" },
    { name: "initial_load", category: "loading", targetMs: 2000, warningMs: 1500, description: "Initial application load" },
    { name: "grid_frame", category: "rendering", targetMs: 16, warningMs: 12, description: "Operational grid frame (60fps = 16ms)" },
    { name: "list_scroll", category: "rendering", targetMs: 16, warningMs: 12, description: "Smooth list scrolling" },
    { name: "first_agent_event", category: "agent", targetMs: 500, warningMs: 300, description: "First agent event visible" },
    { name: "agent_response", category: "agent", targetMs: 2000, warningMs: 1000, description: "Agent completion response" },
    { name: "api_response_p50", category: "network", targetMs: 200, warningMs: 150, description: "API response p50" },
    { name: "api_response_p95", category: "network", targetMs: 1000, warningMs: 700, description: "API response p95" },
    { name: "evidence_upload", category: "network", targetMs: 5000, warningMs: 3000, description: "Evidence file upload (10MB)" },
];
export class PerfBudgetTracker {
    measurements = [];
    measure(name, measuredMs) {
        const budget = DRENYRA_PERF_BUDGETS.find((b) => b.name === name);
        const m = {
            budgetName: name,
            measuredMs,
            passed: budget ? measuredMs <= budget.targetMs : true,
            timestamp: { iso: new Date().toISOString(), unix: Date.now() },
        };
        this.measurements.push(m);
        return m;
    }
    getHistory(name) {
        return name
            ? this.measurements.filter((m) => m.budgetName === name)
            : [...this.measurements];
    }
    getPassRate(name) {
        const ms = this.measurements.filter((m) => m.budgetName === name);
        const passed = ms.filter((m) => m.passed).length;
        return { passed, total: ms.length, rate: ms.length > 0 ? passed / ms.length : 1 };
    }
    getViolations() {
        return DRENYRA_PERF_BUDGETS.filter((b) => {
            const rate = this.getPassRate(b.name);
            return rate.total >= 5 && rate.rate < 0.8;
        });
    }
}
//# sourceMappingURL=performance-budget.js.map