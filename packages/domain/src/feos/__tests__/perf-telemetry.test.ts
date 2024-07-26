import { describe, it, expect } from "vitest";
import { PerfBudgetTracker, DRENYRA_PERF_BUDGETS } from "../performance-budget";
import { TelemetryStore, emptyCostMetrics } from "../product-telemetry";

describe("FEOS-016: PerfBudgetTracker", () => {
  it("has defined performance budgets", () => {
    expect(DRENYRA_PERF_BUDGETS.length).toBeGreaterThan(0);
    expect(DRENYRA_PERF_BUDGETS.some((b) => b.name === "command_palette_open")).toBe(true);
  });

  it("records measurements and checks pass rate", () => {
    const tracker = new PerfBudgetTracker();
    tracker.measure("command_palette_open", 50);  // Within budget (100ms)
    tracker.measure("command_palette_open", 90);  // Within budget
    tracker.measure("command_palette_open", 150); // Over budget

    const rate = tracker.getPassRate("command_palette_open");
    expect(rate.total).toBe(3);
    expect(rate.passed).toBe(2);
  });

  it("returns measurement history", () => {
    const tracker = new PerfBudgetTracker();
    tracker.measure("grid_frame", 15);
    const history = tracker.getHistory("grid_frame");
    expect(history.length).toBe(1);
    expect(history[0].passed).toBe(true);
  });
});

describe("FEOS-018: TelemetryStore", () => {
  it("records telemetry events", () => {
    const store = new TelemetryStore();
    const event = store.record({ category: "feature_usage", name: "close_workspace", tags: ["close"], workspaceId: "ws-1", sessionId: "s1" });
    expect(event.id).toBeDefined();
    expect(event.category).toBe("feature_usage");
  });

  it("records and aggregates cost metrics", () => {
    const store = new TelemetryStore();
    store.recordCost({ metric: "cost_per_document", value: 0.05, unit: "USD", period: "2026-06" });
    store.recordCost({ metric: "cost_per_document", value: 0.03, unit: "USD", period: "2026-06" });

    const aggregated = store.aggregateCost("2026-06");
    const docCost = aggregated.find((m) => m.metric === "cost_per_document");
    expect(docCost).toBeDefined();
    expect(docCost!.value).toBe(0.04); // Average of 0.05 and 0.03
  });

  it("provides empty cost metrics template", () => {
    const metrics = emptyCostMetrics("2026-06");
    expect(metrics.length).toBe(6);
    expect(metrics.some((m) => m.metric === "cost_per_closed_company")).toBe(true);
  });
});
