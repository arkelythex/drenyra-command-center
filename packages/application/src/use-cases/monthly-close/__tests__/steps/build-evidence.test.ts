/**
 * BuildEvidenceStep Tests — Step 9
 */

import { describe, expect, it } from "vitest";
import { BuildEvidenceStep } from "../../steps/build-evidence.step";
import { createEmptyPipelineContext } from "../../types/pipeline-types";
import type { InputSnapshot } from "../../types/input-snapshot";
import type { ReadinessGate } from "../../gates/readiness-gates";

describe("BuildEvidenceStep", () => {
  const step = new BuildEvidenceStep();

  it("should return empty bundle when context has no data", async () => {
    const ctx = createEmptyPipelineContext("m-1", "c-1", "2026-06");

    const r = await step.execute({ context: ctx }, ctx);

    expect(r.success).toBe(true);
    expect(r.data!.evidence).toHaveLength(0);
    expect(r.data!.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("should include snapshot evidence when inputSnapshot exists", async () => {
    const ctx = createEmptyPipelineContext("m-2", "c-2", "2026-06");
    ctx.inputSnapshot = {
      fiscalPeriod: "2026-06", ledgerVersion: 42, invoiceDatasetVersion: 15,
      bankReconciliationVersion: 3, exchangeRateSource: "sunat",
      jurisdictionPackageVersion: "PE-2026-v3", capturedAt: new Date().toISOString(),
    };

    const r = await step.execute({ context: ctx }, ctx);

    expect(r.data!.evidence.length).toBeGreaterThanOrEqual(1);
    const snapshotEvidence = r.data!.evidence.find((e) => e.type === "input-snapshot");
    expect(snapshotEvidence).toBeDefined();
    expect(snapshotEvidence!.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("should include gate evidence when gates exist", async () => {
    const ctx = createEmptyPipelineContext("m-3", "c-3", "2026-06");
    ctx.gates = [{
      name: "Periodo Abierto", type: "period_open", status: "PASS",
      details: "OK", evaluatedAt: new Date().toISOString(),
    }];

    const r = await step.execute({ context: ctx }, ctx);

    const gateEvidence = r.data!.evidence.find((e) => e.type === "gate-results");
    expect(gateEvidence).toBeDefined();
  });

  it("should include proposal evidence when proposal exists", async () => {
    const ctx = createEmptyPipelineContext("m-4", "c-4", "2026-06");
    ctx.proposal = { id: "prop-1", fiscalPeriod: "2026-06" };

    const r = await step.execute({ context: ctx }, ctx);

    const proposalEvidence = r.data!.evidence.find((e) => e.type === "closing-proposal");
    expect(proposalEvidence).toBeDefined();
  });

  it("should produce deterministic hash for same evidence", async () => {
    const ctx1 = createEmptyPipelineContext("m-5", "c-5", "2026-06");
    ctx1.gates = [{ name: "G1", type: "period_open", status: "PASS", details: "", evaluatedAt: "" }];

    const ctx2 = createEmptyPipelineContext("m-5", "c-5", "2026-06");
    ctx2.gates = [{ name: "G1", type: "period_open", status: "PASS", details: "", evaluatedAt: "" }];

    const r1 = await step.execute({ context: ctx1 }, ctx1);
    const r2 = await step.execute({ context: ctx2 }, ctx2);

    expect(r1.data!.hash).toBe(r2.data!.hash);
  });

  it("produces valid SHA-256 hash for evidence bundle", async () => {
    const ctx = createEmptyPipelineContext("m-6", "c-6", "2026-06");
    ctx.inputSnapshot = {
      fiscalPeriod: "2026-06", ledgerVersion: 42, invoiceDatasetVersion: 15,
      bankReconciliationVersion: 3, exchangeRateSource: "sunat",
      jurisdictionPackageVersion: "PE-2026-v3", capturedAt: new Date().toISOString(),
    };

    const r = await step.execute({ context: ctx }, ctx);

    // Hash should be 64 hex chars (SHA-256)
    expect(r.data!.hash).toMatch(/^[0-9a-f]{64}$/);
    // Evidence should exist
    expect(r.data!.evidence.length).toBeGreaterThan(0);
    // Each evidence item should have a valid hash
    for (const item of r.data!.evidence) {
      expect(item.hash).toMatch(/^[0-9a-f]{64}$/);
      expect(item.id).toMatch(/^[0-9a-f-]{36}$/);
    }
  });
});
