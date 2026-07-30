import { describe, expect, it } from "vitest";
import { FreezeSnapshotStep } from "../../steps/freeze-snapshot.step";
import { createEmptyPipelineContext } from "../../types/pipeline-types";

describe("FreezeSnapshotStep", () => {
  const step = new FreezeSnapshotStep();

  it("returns a snapshot with fiscalPeriod", async () => {
    const ctx = createEmptyPipelineContext("m-1", "c-1", "2026-06");
    const r = await step.execute({ companyId: "c-1", fiscalPeriod: "2026-06" }, ctx);

    expect(r.success).toBe(true);
    expect(r.data!.fiscalPeriod).toBe("2026-06");
  });

  it("returns capturedAt timestamp", async () => {
    const ctx = createEmptyPipelineContext("m-2", "c-2", "2026-06");
    const r = await step.execute({ companyId: "c-2", fiscalPeriod: "2026-06" }, ctx);

    expect(r.data!.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("has expected snapshot fields", async () => {
    const ctx = createEmptyPipelineContext("m-3", "c-3", "2026-06");
    const r = await step.execute({ companyId: "c-3", fiscalPeriod: "2026-06" }, ctx);

    expect(r.data!.ledgerVersion).toBeNull();
    expect(r.data!.invoiceDatasetVersion).toBeNull();
    expect(r.data!.bankReconciliationVersion).toBeNull();
    expect(r.data!.exchangeRateSource).toBe("sunat");
    expect(r.data!.jurisdictionPackageVersion).toBe("PE-2026-v1");
  });

  it("has correct name and policy metadata", () => {
    expect(step.name).toBe("FreezeSnapshot");
    expect(step.isBlocker).toBe(false);
    expect(step.retryPolicy.type).toBe("none");
  });
});
