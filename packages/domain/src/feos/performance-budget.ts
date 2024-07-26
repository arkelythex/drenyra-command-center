/**
 * FEOS-016 — Performance and UX Budgets
 *
 * Performance budgets for Drenyra's Financial Workbench.
 * Inspired by Ghostty's philosophy: instant, native, configurable.
 *
 * Targets:
 * - Command palette opened < 100ms
 * - Switch between loaded views: immediate
 * - Visual response to interaction < 100ms
 * - Workspace restoration < 300ms
 * - First agent event < 500ms
 * - Operational grid: 60fps target
 *
 * @module @drenyra/domain/feos/performance-budget
 */

import type { Timestamp } from "./types";

export type BudgetCategory = "perception" | "loading" | "rendering" | "agent" | "network";

export interface PerfBudget {
  name: string;
  category: BudgetCategory;
  targetMs: number;
  warningMs: number;   // Warning threshold before target
  description: string;
}

export const DRENYRA_PERF_BUDGETS: PerfBudget[] = [
  // Perception
  { name: "command_palette_open", category: "perception", targetMs: 100, warningMs: 80, description: "Command palette opens" },
  { name: "pane_switch", category: "perception", targetMs: 50, warningMs: 30, description: "Switch between loaded panes" },
  { name: "click_response", category: "perception", targetMs: 100, warningMs: 70, description: "Visual response to click/tap" },

  // Loading
  { name: "workspace_restore", category: "loading", targetMs: 300, warningMs: 200, description: "Workspace state restoration" },
  { name: "layout_restore", category: "loading", targetMs: 200, warningMs: 150, description: "Layout persistence restore" },
  { name: "initial_load", category: "loading", targetMs: 2000, warningMs: 1500, description: "Initial application load" },

  // Rendering
  { name: "grid_frame", category: "rendering", targetMs: 16, warningMs: 12, description: "Operational grid frame (60fps = 16ms)" },
  { name: "list_scroll", category: "rendering", targetMs: 16, warningMs: 12, description: "Smooth list scrolling" },

  // Agent
  { name: "first_agent_event", category: "agent", targetMs: 500, warningMs: 300, description: "First agent event visible" },
  { name: "agent_response", category: "agent", targetMs: 2000, warningMs: 1000, description: "Agent completion response" },

  // Network
  { name: "api_response_p50", category: "network", targetMs: 200, warningMs: 150, description: "API response p50" },
  { name: "api_response_p95", category: "network", targetMs: 1000, warningMs: 700, description: "API response p95" },
  { name: "evidence_upload", category: "network", targetMs: 5000, warningMs: 3000, description: "Evidence file upload (10MB)" },
];

export interface PerfMeasurement {
  budgetName: string;
  measuredMs: number;
  passed: boolean;
  timestamp: Timestamp;
  metadata?: Record<string, unknown>;
}

export class PerfBudgetTracker {
  private measurements: PerfMeasurement[] = [];

  measure(name: string, measuredMs: number): PerfMeasurement {
    const budget = DRENYRA_PERF_BUDGETS.find((b) => b.name === name);
    const m: PerfMeasurement = {
      budgetName: name,
      measuredMs,
      passed: budget ? measuredMs <= budget.targetMs : true,
      timestamp: { iso: new Date().toISOString(), unix: Date.now() },
    };
    this.measurements.push(m);
    return m;
  }

  getHistory(name?: string): PerfMeasurement[] {
    return name
      ? this.measurements.filter((m) => m.budgetName === name)
      : [...this.measurements];
  }

  getPassRate(name: string): { passed: number; total: number; rate: number } {
    const ms = this.measurements.filter((m) => m.budgetName === name);
    const passed = ms.filter((m) => m.passed).length;
    return { passed, total: ms.length, rate: ms.length > 0 ? passed / ms.length : 1 };
  }

  /** Report any budgets consistently failing. */
  getViolations(): PerfBudget[] {
    return DRENYRA_PERF_BUDGETS.filter((b) => {
      const rate = this.getPassRate(b.name);
      return rate.total >= 5 && rate.rate < 0.8; // Less than 80% pass rate over last 5
    });
  }
}
