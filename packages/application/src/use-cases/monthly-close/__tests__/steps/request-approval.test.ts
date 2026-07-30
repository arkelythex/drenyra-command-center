import { describe, expect, it, vi } from "vitest";
import { RequestApprovalStep } from "../../steps/request-approval.step";
import { createEmptyPipelineContext } from "../../types/pipeline-types";

describe("RequestApprovalStep", () => {
  const step = new RequestApprovalStep();

  it("creates an approval request with PR id", async () => {
    const ctx = createEmptyPipelineContext("m-1", "c-1", "2026-06");
    ctx.proposal = { id: "prop-001", fiscalPeriod: "2026-06" };
    ctx.eventEmitter = {
      emitStepProgress: vi.fn(), emitBlockers: vi.fn(),
      emitProposalCreated: vi.fn(), emitStateTransition: vi.fn(),
    };

    const r = await step.execute({ context: ctx }, ctx);

    expect(r.success).toBe(true);
    expect(r.data!.prId).toMatch(/^[0-9a-f-]{36}$/);
    expect(r.data!.prNumber).toContain("2026-06");
    expect(r.data!.status).toBe("PENDING_REVIEW");
  });

  it("fails when no proposal exists", async () => {
    const ctx = createEmptyPipelineContext("m-2", "c-2", "2026-06");
    const r = await step.execute({ context: ctx }, ctx);
    expect(r.success).toBe(false);
    expect(r.errors[0]!.code).toBe("NO_PROPOSAL");
  });

  it("links AccountingPR to proposal", async () => {
    const ctx = createEmptyPipelineContext("m-3", "c-3", "2026-06");
    ctx.proposal = { id: "prop-003", fiscalPeriod: "2026-06" };
    ctx.eventEmitter = {
      emitStepProgress: vi.fn(), emitBlockers: vi.fn(),
      emitProposalCreated: vi.fn(), emitStateTransition: vi.fn(),
    };

    const r = await step.execute({ context: ctx }, ctx);
    expect((ctx.proposal as any).accountingPrId).toBe(r.data!.prId);
  });

  it("emits proposal created event", async () => {
    const ctx = createEmptyPipelineContext("m-4", "c-4", "2026-06");
    ctx.proposal = { id: "prop-004", fiscalPeriod: "2026-06" };
    const emitter = {
      emitStepProgress: vi.fn(), emitBlockers: vi.fn(),
      emitProposalCreated: vi.fn().mockResolvedValue(undefined),
      emitStateTransition: vi.fn(),
    };
    ctx.eventEmitter = emitter;
    await step.execute({ context: ctx }, ctx);
    expect(emitter.emitProposalCreated).toHaveBeenCalledWith("m-4", ctx.proposal);
  });
});
