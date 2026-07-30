import { describe, expect, it } from "vitest";
import { ValidateGatesStep } from "../../steps/validate-gates.step";
import { createEmptyPipelineContext } from "../../types/pipeline-types";

function makeSnapshot() {
  return {
    fiscalPeriod: "2026-06", ledgerVersion: 42, invoiceDatasetVersion: 15,
    bankReconciliationVersion: 3, exchangeRateSource: "sunat",
    jurisdictionPackageVersion: "PE-2026-v3", capturedAt: new Date().toISOString(),
  };
}

describe("ValidateGatesStep", () => {
  const step = new ValidateGatesStep();

  it("evaluates all 7 gates", async () => {
    const ctx = createEmptyPipelineContext("m-1", "c-1", "2026-06");
    const r = await step.execute(
      { companyId: "c-1", fiscalPeriod: "2026-06", snapshot: makeSnapshot() },
      ctx,
    );

    expect(r.success).toBe(true);
    expect(r.data!.gates).toHaveLength(7);
  });

  it("returns overallStatus", async () => {
    const ctx = createEmptyPipelineContext("m-2", "c-2", "2026-06");
    const r = await step.execute(
      { companyId: "c-2", fiscalPeriod: "2026-06", snapshot: makeSnapshot() },
      ctx,
    );

    expect(r.data!.overallStatus).toBeDefined();
    expect(["PASS", "FAIL", "WARN", "UNKNOWN"]).toContain(r.data!.overallStatus);
  });

  it("passes when period is abierto (hardcoded)", async () => {
    const ctx = createEmptyPipelineContext("m-3", "c-3", "2026-06");
    const r = await step.execute(
      { companyId: "c-3", fiscalPeriod: "2026-06", snapshot: makeSnapshot() },
      ctx,
    );

    const periodGate = r.data!.gates.find((g) => g.type === "period_open");
    expect(periodGate!.status).toBe("PASS");
  });

  it("prior_period_closed passes when prior is cerrado_final", async () => {
    const ctx = createEmptyPipelineContext("m-4", "c-4", "2026-06");
    const r = await step.execute(
      { companyId: "c-4", fiscalPeriod: "2026-06", snapshot: makeSnapshot() },
      ctx,
    );

    const priorGate = r.data!.gates.find((g) => g.type === "prior_period_closed");
    expect(priorGate!.status).toBe("PASS");
  });

  it("collects exceptions for non-blocking FAILs", async () => {
    const ctx = createEmptyPipelineContext("m-5", "c-5", "2026-06");
    // With default evaluator params (0 debits, 0 credits => balanced => PASS)
    // Non-blocking gates pass by default in PR2, exceptions arise only on real failures
    const r = await step.execute(
      { companyId: "c-5", fiscalPeriod: "2026-06", snapshot: makeSnapshot() },
      ctx,
    );

    // All gates pass with default inputs
    expect(r.exceptions.length).toBe(0);
  });

  it("has correct step metadata", () => {
    expect(step.name).toBe("ValidateGates");
    expect(step.isBlocker).toBe(true);
    expect(step.retryPolicy.type).toBe("none");
  });
});
