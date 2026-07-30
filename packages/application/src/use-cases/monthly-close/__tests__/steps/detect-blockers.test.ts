/**
 * DetectBlockersStep Tests — Step 7
 */

import { describe, expect, it } from "vitest";
import { DetectBlockersStep } from "../../steps/detect-blockers.step";
import { createEmptyPipelineContext } from "../../types/pipeline-types";
import type { AccountingException } from "../../types/accounting-exception";
import type { ReadinessGate } from "../../gates/readiness-gates";

function makeException(overrides: Partial<AccountingException> = {}): AccountingException {
  return {
    id: "ex-001", missionId: "m-1", code: "MISSING_DOCUMENT",
    severity: "warning", subjectRef: "doc:1", evidenceRefs: [],
    resolutionStatus: "open", ...overrides,
  };
}

function makeGate(overrides: Partial<ReadinessGate> = {}): ReadinessGate {
  return {
    name: "Test Gate", type: "period_open", status: "PASS",
    details: "OK", evaluatedAt: new Date().toISOString(), ...overrides,
  };
}

describe("DetectBlockersStep", () => {
  const step = new DetectBlockersStep();
  const ctx = createEmptyPipelineContext("m-1", "c-1", "2026-06");

  it("should return hasBlockers=false when no exceptions or gate failures", async () => {
    const r = await step.execute({ exceptions: [], gateResults: [] }, ctx);
    expect(r.success).toBe(true);
    expect(r.data!.hasBlockers).toBe(false);
    expect(r.data!.blockers).toHaveLength(0);
  });

  it("should detect blocking exceptions", async () => {
    const r = await step.execute({
      exceptions: [makeException({ severity: "blocking", code: "MISSING_DOCUMENT" })],
      gateResults: [],
    }, ctx);

    expect(r.success).toBe(false);
    expect(r.data!.hasBlockers).toBe(true);
    expect(r.data!.blockers).toHaveLength(1);
    expect(r.data!.blockers[0]!.gateType).toBe("MISSING_DOCUMENT");
  });

  it("should detect failed blocking gates", async () => {
    const r = await step.execute({
      exceptions: [],
      gateResults: [makeGate({ type: "period_open", status: "FAIL", details: "Period is closed" })],
    }, ctx);

    expect(r.success).toBe(false);
    expect(r.data!.hasBlockers).toBe(true);
    expect(r.data!.blockers[0]!.gateType).toBe("period_open");
  });

  it("should detect prior_period_closed FAIL as blocker", async () => {
    const r = await step.execute({
      exceptions: [],
      gateResults: [makeGate({ type: "prior_period_closed", status: "FAIL", details: "Prior not closed" })],
    }, ctx);

    expect(r.data!.hasBlockers).toBe(true);
    expect(r.data!.blockers[0]!.gateType).toBe("prior_period_closed");
  });

  it("should ignore non-blocking exceptions", async () => {
    const r = await step.execute({
      exceptions: [makeException({ severity: "warning" }), makeException({ severity: "info" })],
      gateResults: [],
    }, ctx);

    expect(r.success).toBe(true);
    expect(r.data!.hasBlockers).toBe(false);
  });

  it("should ignore non-blocking gate failures", async () => {
    const r = await step.execute({
      exceptions: [],
      gateResults: [makeGate({ type: "entries_balanced", status: "FAIL" })],
    }, ctx);

    expect(r.success).toBe(true);
    expect(r.data!.hasBlockers).toBe(false);
  });
});
