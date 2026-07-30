/**
 * Pipeline Types Tests
 *
 * Tests for PipelineStepResult, PipelineContext, and related types.
 * PR1 — Type foundations for Real Monthly Close Execution.
 */

import { describe, expect, it } from "vitest";
import type { InputSnapshot } from "../types/input-snapshot";
import type { AccountingException } from "../types/accounting-exception";
import type { ReadinessGate } from "../gates/readiness-gates";
import {
  type PipelineStepResult,
  type PipelineContext,
  type GateResults,
  type MissionBlocker,
  type BlockerReport,
  createEmptyPipelineContext,
  computeOverallGateStatus,
} from "../types/pipeline-types";

// ─── PipelineStepResult ────────────────────────────────────────────────────

describe("PipelineStepResult type", () => {
  it("should accept a successful step result", () => {
    const result: PipelineStepResult = {
      stepName: "freeze-snapshot",
      status: "COMPLETED",
      data: { fiscalPeriod: "2026-06" },
      exceptions: [],
      gates: [],
      timestamp: "2026-07-01T00:00:00.000Z",
    };

    expect(result.stepName).toBe("freeze-snapshot");
    expect(result.status).toBe("COMPLETED");
    expect(result.data).toEqual({ fiscalPeriod: "2026-06" });
    expect(result.exceptions).toEqual([]);
    expect(result.gates).toEqual([]);
    expect(result.timestamp).toBe("2026-07-01T00:00:00.000Z");
  });

  it("should accept a failed step result with exceptions", () => {
    const ex: AccountingException = {
      id: "ex-001",
      missionId: "m-001",
      code: "MISSING_DOCUMENT",
      severity: "warning",
      subjectRef: "doc:123",
      evidenceRefs: [],
      resolutionStatus: "open",
    };

    const result: PipelineStepResult = {
      stepName: "analyze-invoices",
      status: "FAILED",
      exceptions: [ex],
      gates: [],
      timestamp: "2026-07-01T00:00:05.000Z",
    };

    expect(result.status).toBe("FAILED");
    expect(result.exceptions).toHaveLength(1);
    expect(result.exceptions[0]!.code).toBe("MISSING_DOCUMENT");
    expect(result.data).toBeUndefined();
  });

  it("should support all status values", () => {
    const statuses = [
      "PENDING",
      "STARTED",
      "COMPLETED",
      "FAILED",
      "SKIPPED",
    ] as const;

    for (const status of statuses) {
      const result: PipelineStepResult = {
        stepName: "test-step",
        status,
        exceptions: [],
        gates: [],
        timestamp: "2026-07-01T00:00:00.000Z",
      };
      expect(result.status).toBe(status);
    }
  });

  it("should support gate results in step", () => {
    const gate: ReadinessGate = {
      name: "Periodo Abierto",
      type: "period_open",
      status: "PASS",
      details: "OK",
      evaluatedAt: "2026-07-01T00:00:00.000Z",
    };

    const result: PipelineStepResult = {
      stepName: "validate-gates",
      status: "COMPLETED",
      exceptions: [],
      gates: [gate],
      timestamp: "2026-07-01T00:00:00.000Z",
    };

    expect(result.gates).toHaveLength(1);
    expect(result.gates[0]!.type).toBe("period_open");
  });
});

// ─── PipelineContext ───────────────────────────────────────────────────────

describe("PipelineContext type", () => {
  it("should accept a fully populated context", () => {
    const snapshot: InputSnapshot = {
      fiscalPeriod: "2026-06",
      ledgerVersion: 42,
      invoiceDatasetVersion: 15,
      bankReconciliationVersion: 3,
      exchangeRateSource: "sunat",
      jurisdictionPackageVersion: "PE-2026-v3",
      capturedAt: "2026-07-01T00:00:00.000Z",
    };

    const ctx: PipelineContext = {
      missionId: "mission-001",
      companyId: "company-001",
      fiscalPeriod: "2026-06",
      inputSnapshot: snapshot,
      gates: [],
      exceptions: [],
      proposal: null,
      currentStep: "freeze-snapshot",
      errors: [],
    };

    expect(ctx.missionId).toBe("mission-001");
    expect(ctx.companyId).toBe("company-001");
    expect(ctx.fiscalPeriod).toBe("2026-06");
    expect(ctx.inputSnapshot).toBe(snapshot);
    expect(ctx.gates).toEqual([]);
    expect(ctx.exceptions).toEqual([]);
    expect(ctx.proposal).toBeNull();
    expect(ctx.currentStep).toBe("freeze-snapshot");
    expect(ctx.errors).toEqual([]);
  });

  it("should support accumulated gates", () => {
    const gate: ReadinessGate = {
      name: "Asientos Balanceados",
      type: "entries_balanced",
      status: "PASS",
      details: "OK",
      evaluatedAt: "2026-07-01T00:00:00.000Z",
    };

    const ctx: PipelineContext = {
      missionId: "mission-002",
      companyId: "company-002",
      fiscalPeriod: "2026-07",
      inputSnapshot: null,
      gates: [gate],
      exceptions: [],
      proposal: null,
      currentStep: "validate-gates",
      errors: [],
    };

    expect(ctx.gates).toHaveLength(1);
    expect(ctx.gates[0]!.type).toBe("entries_balanced");
    expect(ctx.inputSnapshot).toBeNull();
  });

  it("should support accumulated exceptions", () => {
    const ex: AccountingException = {
      id: "ex-010",
      missionId: "mission-003",
      code: "SUNAT_DISCREPANCY",
      severity: "warning",
      subjectRef: "cpe:uuid-abc",
      evidenceRefs: [],
      resolutionStatus: "open",
    };

    const ctx: PipelineContext = {
      missionId: "mission-003",
      companyId: "company-003",
      fiscalPeriod: "2026-08",
      inputSnapshot: null,
      gates: [],
      exceptions: [ex],
      proposal: null,
      currentStep: "analyze-compliance",
      errors: [],
    };

    expect(ctx.exceptions).toHaveLength(1);
    expect(ctx.exceptions[0]!.code).toBe("SUNAT_DISCREPANCY");
  });

  it("should support errors array", () => {
    const ctx: PipelineContext = {
      missionId: "mission-004",
      companyId: "company-004",
      fiscalPeriod: "2026-09",
      inputSnapshot: null,
      gates: [],
      exceptions: [],
      proposal: null,
      currentStep: "freeze-snapshot",
      errors: ["Database connection failed", "Retry exhausted"],
    };

    expect(ctx.errors).toHaveLength(2);
  });
});

// ─── GateResults ───────────────────────────────────────────────────────────

describe("GateResults type", () => {
  it("should accept gates and overallStatus", () => {
    const gate: ReadinessGate = {
      name: "Periodo Abierto",
      type: "period_open",
      status: "PASS",
      details: "OK",
      evaluatedAt: "2026-07-01T00:00:00.000Z",
    };

    const result: GateResults = {
      gates: [gate],
      overallStatus: "PASS",
    };

    expect(result.gates).toHaveLength(1);
    expect(result.overallStatus).toBe("PASS");
  });
});

// ─── MissionBlocker ────────────────────────────────────────────────────────

describe("MissionBlocker type", () => {
  it("should accept a valid blocker", () => {
    const blocker: MissionBlocker = {
      gateType: "prior_period_closed",
      reason: "Prior period 2026-05 is still abierto",
      blockedAt: "2026-07-01T00:00:01.000Z",
    };

    expect(blocker.gateType).toBe("prior_period_closed");
    expect(blocker.reason).toBe("Prior period 2026-05 is still abierto");
    expect(blocker.blockedAt).toBe("2026-07-01T00:00:01.000Z");
  });
});

// ─── BlockerReport ─────────────────────────────────────────────────────────

describe("BlockerReport type", () => {
  it("should accept a report with blockers", () => {
    const blocker: MissionBlocker = {
      gateType: "period_open",
      reason: "Period is cerrado_final",
      blockedAt: "2026-07-01T00:00:00.000Z",
    };

    const report: BlockerReport = {
      hasBlockers: true,
      blockers: [blocker],
    };

    expect(report.hasBlockers).toBe(true);
    expect(report.blockers).toHaveLength(1);
  });

  it("should accept a report with no blockers", () => {
    const report: BlockerReport = {
      hasBlockers: false,
      blockers: [],
    };

    expect(report.hasBlockers).toBe(false);
    expect(report.blockers).toHaveLength(0);
  });
});

// ─── createEmptyPipelineContext ────────────────────────────────────────────

describe("createEmptyPipelineContext", () => {
  it("should create context with provided identity fields", () => {
    const ctx = createEmptyPipelineContext(
      "mission-100",
      "company-100",
      "2026-10",
    );

    expect(ctx.missionId).toBe("mission-100");
    expect(ctx.companyId).toBe("company-100");
    expect(ctx.fiscalPeriod).toBe("2026-10");
  });

  it("should initialize with null snapshot", () => {
    const ctx = createEmptyPipelineContext("m", "c", "2026-01");
    expect(ctx.inputSnapshot).toBeNull();
  });

  it("should initialize with empty arrays", () => {
    const ctx = createEmptyPipelineContext("m", "c", "2026-01");
    expect(ctx.gates).toEqual([]);
    expect(ctx.exceptions).toEqual([]);
    expect(ctx.errors).toEqual([]);
  });

  it("should initialize with null proposal", () => {
    const ctx = createEmptyPipelineContext("m", "c", "2026-01");
    expect(ctx.proposal).toBeNull();
  });

  it("should set currentStep to empty string", () => {
    const ctx = createEmptyPipelineContext("m", "c", "2026-01");
    expect(ctx.currentStep).toBe("");
  });
});

// ─── computeOverallGateStatus ──────────────────────────────────────────────

describe("computeOverallGateStatus", () => {
  it("should return PASS when all gates pass", () => {
    const gates: ReadinessGate[] = [
      { name: "A", type: "period_open", status: "PASS", details: "", evaluatedAt: "" },
      { name: "B", type: "entries_balanced", status: "PASS", details: "", evaluatedAt: "" },
    ];
    expect(computeOverallGateStatus(gates)).toBe("PASS");
  });

  it("should return FAIL when any gate fails", () => {
    const gates: ReadinessGate[] = [
      { name: "A", type: "period_open", status: "PASS", details: "", evaluatedAt: "" },
      { name: "B", type: "entries_balanced", status: "FAIL", details: "", evaluatedAt: "" },
    ];
    expect(computeOverallGateStatus(gates)).toBe("FAIL");
  });

  it("should return WARN when worst is WARN", () => {
    const gates: ReadinessGate[] = [
      { name: "A", type: "period_open", status: "PASS", details: "", evaluatedAt: "" },
      { name: "B", type: "documents_processed", status: "WARN", details: "", evaluatedAt: "" },
    ];
    expect(computeOverallGateStatus(gates)).toBe("WARN");
  });

  it("should return UNKNOWN when any gate is UNKNOWN", () => {
    const gates: ReadinessGate[] = [
      { name: "A", type: "period_open", status: "PASS", details: "", evaluatedAt: "" },
      { name: "B", type: "prior_period_closed", status: "UNKNOWN", details: "", evaluatedAt: "" },
    ];
    expect(computeOverallGateStatus(gates)).toBe("UNKNOWN");
  });

  it("should return PASS when all NOT_APPLICABLE", () => {
    const gates: ReadinessGate[] = [
      { name: "A", type: "prior_period_closed", status: "NOT_APPLICABLE", details: "", evaluatedAt: "" },
    ];
    expect(computeOverallGateStatus(gates)).toBe("PASS");
  });

  it("FAIL takes precedence over WARN", () => {
    const gates: ReadinessGate[] = [
      { name: "A", type: "period_open", status: "WARN", details: "", evaluatedAt: "" },
      { name: "B", type: "entries_balanced", status: "FAIL", details: "", evaluatedAt: "" },
    ];
    expect(computeOverallGateStatus(gates)).toBe("FAIL");
  });

  it("FAIL takes precedence over UNKNOWN", () => {
    const gates: ReadinessGate[] = [
      { name: "A", type: "period_open", status: "UNKNOWN", details: "", evaluatedAt: "" },
      { name: "B", type: "entries_balanced", status: "FAIL", details: "", evaluatedAt: "" },
    ];
    expect(computeOverallGateStatus(gates)).toBe("FAIL");
  });
});
