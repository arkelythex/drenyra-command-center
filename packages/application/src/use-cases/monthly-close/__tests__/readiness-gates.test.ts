/**
 * ReadinessGates Tests
 *
 * Tests for all 7 gate evaluators, GateStatus, ReadinessGate, and GateResult types.
 * PR1 — Type foundations for Real Monthly Close Execution.
 */

import { describe, expect, it } from "vitest";
import {
  type GateResult,
  type GateStatus,
  type ReadinessGate,
  evaluatePeriodOpen,
  evaluateEntriesBalanced,
  evaluateReconciliationsComplete,
  evaluateDocumentsProcessed,
  evaluateMinEvidence,
  evaluateNoIncompatibleMissions,
  evaluatePriorPeriodClosed,
  allGates,
} from "../gates/readiness-gates";

// ─── GateStatus type ──────────────────────────────────────────────────────

describe("GateStatus type", () => {
  it("should accept PASS status", () => {
    const status: GateStatus = "PASS";
    expect(status).toBe("PASS");
  });

  it("should accept FAIL status", () => {
    const status: GateStatus = "FAIL";
    expect(status).toBe("FAIL");
  });

  it("should accept WARN status", () => {
    const status: GateStatus = "WARN";
    expect(status).toBe("WARN");
  });

  it("should accept UNKNOWN status", () => {
    const status: GateStatus = "UNKNOWN";
    expect(status).toBe("UNKNOWN");
  });

  it("should accept NOT_APPLICABLE status", () => {
    const status: GateStatus = "NOT_APPLICABLE";
    expect(status).toBe("NOT_APPLICABLE");
  });
});

// ─── ReadinessGate interface ───────────────────────────────────────────────

describe("ReadinessGate interface", () => {
  it("should accept a valid ReadinessGate object", () => {
    const gate: ReadinessGate = {
      name: "Periodo Abierto",
      type: "period_open",
      status: "PASS",
      details: "Period is open and ready",
      evaluatedAt: "2026-07-01T00:00:00.000Z",
    };

    expect(gate.name).toBe("Periodo Abierto");
    expect(gate.type).toBe("period_open");
    expect(gate.status).toBe("PASS");
    expect(gate.details).toBe("Period is open and ready");
    expect(gate.evaluatedAt).toBe("2026-07-01T00:00:00.000Z");
  });
});

// ─── GateResult type ───────────────────────────────────────────────────────

describe("GateResult type", () => {
  it("should contain gate name, status, details, and evaluatedAt", () => {
    const result: GateResult = {
      gateName: "period_open",
      status: "PASS",
      details: "Period 2026-06 is 'abierto' — ready to close",
      evaluatedAt: "2026-07-01T00:00:00.000Z",
    };

    expect(result.gateName).toBe("period_open");
    expect(result.status).toBe("PASS");
    expect(result.details).toContain("abierto");
    expect(result.evaluatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

// ─── Gate 1: period_open ──────────────────────────────────────────────────

describe("evaluatePeriodOpen", () => {
  it("should return PASS when period is open", () => {
    const result = evaluatePeriodOpen("abierto", "2026-06");
    expect(result.status).toBe("PASS");
    expect(result.gateName).toBe("period_open");
  });

  it("should return FAIL when period is not abierto", () => {
    const result = evaluatePeriodOpen("cerrado_parcial", "2026-06");
    expect(result.status).toBe("FAIL");
    expect(result.details).toContain("cerrado_parcial");
  });

  it("should return FAIL when period status is cerrado_final", () => {
    const result = evaluatePeriodOpen("cerrado_final", "2026-06");
    expect(result.status).toBe("FAIL");
  });

  it("should return FAIL when no period row exists (undefined status)", () => {
    const result = evaluatePeriodOpen(undefined, "2026-06");
    expect(result.status).toBe("FAIL");
    expect(result.details).toContain("No accounting period found");
  });
});

// ─── Gate 2: entries_balanced ─────────────────────────────────────────────

describe("evaluateEntriesBalanced", () => {
  it("should return PASS when debits equal credits", () => {
    const result = evaluateEntriesBalanced(100000, 100000);
    expect(result.status).toBe("PASS");
    expect(result.gateName).toBe("entries_balanced");
  });

  it("should return PASS when both are zero (no entries)", () => {
    const result = evaluateEntriesBalanced(0, 0);
    expect(result.status).toBe("PASS");
  });

  it("should return FAIL when debits do not equal credits", () => {
    const result = evaluateEntriesBalanced(100000, 99900);
    expect(result.status).toBe("FAIL");
    expect(result.details).toContain("Unbalanced");
  });

  it("should return FAIL when debits > credits", () => {
    const result = evaluateEntriesBalanced(150000, 100000);
    expect(result.status).toBe("FAIL");
  });

  it("should return FAIL when credits > debits", () => {
    const result = evaluateEntriesBalanced(50000, 75000);
    expect(result.status).toBe("FAIL");
  });
});

// ─── Gate 3: reconciliations_complete ─────────────────────────────────────

describe("evaluateReconciliationsComplete", () => {
  it("should return PASS when all reconciliations are complete", () => {
    const result = evaluateReconciliationsComplete(3, 3);
    expect(result.status).toBe("PASS");
    expect(result.gateName).toBe("reconciliations_complete");
  });

  it("should return PASS when zero accounts exist", () => {
    const result = evaluateReconciliationsComplete(0, 0);
    expect(result.status).toBe("PASS");
  });

  it("should return FAIL when some reconciliations are incomplete", () => {
    const result = evaluateReconciliationsComplete(5, 3);
    expect(result.status).toBe("FAIL");
    expect(result.details).toContain("3 of 5");
  });

  it("should return FAIL when no reconciliations done", () => {
    const result = evaluateReconciliationsComplete(4, 0);
    expect(result.status).toBe("FAIL");
  });
});

// ─── Gate 4: documents_processed ──────────────────────────────────────────

describe("evaluateDocumentsProcessed", () => {
  it("should return PASS when no pending or rejected documents", () => {
    const result = evaluateDocumentsProcessed(0, 0);
    expect(result.status).toBe("PASS");
    expect(result.gateName).toBe("documents_processed");
  });

  it("should return FAIL when there are pending documents", () => {
    const result = evaluateDocumentsProcessed(2, 0);
    expect(result.status).toBe("FAIL");
    expect(result.details).toContain("2 pending");
  });

  it("should return FAIL when there are rejected documents", () => {
    const result = evaluateDocumentsProcessed(0, 3);
    expect(result.status).toBe("FAIL");
    expect(result.details).toContain("3 rejected");
  });

  it("should return FAIL when both pending and rejected exist", () => {
    const result = evaluateDocumentsProcessed(2, 1);
    expect(result.status).toBe("FAIL");
    expect(result.details).toContain("2 pending");
    expect(result.details).toContain("1 rejected");
  });
});

// ─── Gate 5: min_evidence ─────────────────────────────────────────────────

describe("evaluateMinEvidence", () => {
  it("should return PASS when all categories have evidence", () => {
    const result = evaluateMinEvidence({ bank: 2, tax: 1, invoices: 3 });
    expect(result.status).toBe("PASS");
    expect(result.gateName).toBe("min_evidence");
  });

  it("should return FAIL when a category has zero evidence", () => {
    const result = evaluateMinEvidence({ bank: 0, tax: 1, invoices: 3 });
    expect(result.status).toBe("FAIL");
    expect(result.details).toContain("bank");
  });

  it("should return FAIL when multiple categories have zero evidence", () => {
    const result = evaluateMinEvidence({ bank: 0, tax: 0, invoices: 0 });
    expect(result.status).toBe("FAIL");
  });

  it("should list all missing categories in details", () => {
    const result = evaluateMinEvidence({ bank: 0, tax: 0, invoices: 1 });
    expect(result.status).toBe("FAIL");
    expect(result.details).toContain("bank");
    expect(result.details).toContain("tax");
  });
});

// ─── Gate 6: no_incompatible_missions ─────────────────────────────────────

describe("evaluateNoIncompatibleMissions", () => {
  it("should return PASS when no other running close missions exist", () => {
    const result = evaluateNoIncompatibleMissions(0);
    expect(result.status).toBe("PASS");
    expect(result.gateName).toBe("no_incompatible_missions");
  });

  it("should return FAIL when another running close mission exists", () => {
    const result = evaluateNoIncompatibleMissions(1);
    expect(result.status).toBe("FAIL");
    expect(result.details).toContain("1 other");
  });

  it("should return FAIL when multiple running close missions exist", () => {
    const result = evaluateNoIncompatibleMissions(3);
    expect(result.status).toBe("FAIL");
    expect(result.details).toContain("3 other");
  });
});

// ─── Gate 7: prior_period_closed ──────────────────────────────────────────

describe("evaluatePriorPeriodClosed", () => {
  it("should return NOT_APPLICABLE when isFirstPeriod is true", () => {
    const result = evaluatePriorPeriodClosed(true, null, "2026-01");
    expect(result.status).toBe("NOT_APPLICABLE");
    expect(result.gateName).toBe("prior_period_closed");
    expect(result.details).toContain("First accounting period");
  });

  it("should return PASS when prior period is cerrado_final", () => {
    const result = evaluatePriorPeriodClosed(false, "cerrado_final", "2026-06");
    expect(result.status).toBe("PASS");
  });

  it("should return PASS when prior period is auditado", () => {
    const result = evaluatePriorPeriodClosed(false, "auditado", "2026-06");
    expect(result.status).toBe("PASS");
  });

  it("should return FAIL when prior period is abierto", () => {
    const result = evaluatePriorPeriodClosed(false, "abierto", "2026-06");
    expect(result.status).toBe("FAIL");
    expect(result.details).toContain("abierto");
  });

  it("should return FAIL when prior period is cerrado_parcial", () => {
    const result = evaluatePriorPeriodClosed(false, "cerrado_parcial", "2026-06");
    expect(result.status).toBe("FAIL");
  });

  it("should return UNKNOWN when prior period status is null", () => {
    const result = evaluatePriorPeriodClosed(false, null, "2026-06");
    expect(result.status).toBe("UNKNOWN");
    expect(result.details).toContain("No prior accounting period found");
  });
});

// ─── allGates array ────────────────────────────────────────────────────────

describe("allGates", () => {
  it("should contain exactly 7 gates", () => {
    expect(allGates).toHaveLength(7);
  });

  it("should contain all expected gate types", () => {
    const types = allGates.map((g) => g.type);
    expect(types).toContain("period_open");
    expect(types).toContain("entries_balanced");
    expect(types).toContain("reconciliations_complete");
    expect(types).toContain("documents_processed");
    expect(types).toContain("min_evidence");
    expect(types).toContain("no_incompatible_missions");
    expect(types).toContain("prior_period_closed");
  });

  it("should mark period_open as blocking", () => {
    const gate = allGates.find((g) => g.type === "period_open");
    expect(gate).toBeDefined();
    expect(gate!.isBlocker).toBe(true);
  });

  it("should mark prior_period_closed as blocking", () => {
    const gate = allGates.find((g) => g.type === "prior_period_closed");
    expect(gate).toBeDefined();
    expect(gate!.isBlocker).toBe(true);
  });

  it("should mark non-blocking gates as not blockers", () => {
    const nonBlocking = allGates.filter(
      (g) => g.type !== "period_open" && g.type !== "prior_period_closed",
    );
    for (const gate of nonBlocking) {
      expect(gate.isBlocker).toBe(false);
    }
  });
});
