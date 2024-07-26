import { describe, expect, it } from "vitest";
import {
  FeosError,
  Workspace,
  computePortfolioRollup,
  createPeriodRef,
  type WorkspaceProps,
} from "@drenyra/domain";

const actor = { id: "agent-1", type: "agent" as const, label: "Reconciler" };
const period = createPeriodRef(2026, 6);

function createWorkspace() {
  return Workspace.create({
    organizationId: "org-1" as never,
    companyId: "company-1" as never,
    companyRuc: "20123456789",
    period,
    intent: "reconcile",
    label: "June reconciliation",
    createdBy: actor,
  });
}

function props(state: WorkspaceProps["state"]): WorkspaceProps {
  return {
    id: `workspace-${state}` as never,
    organizationId: "org-1" as never,
    companyId: "company-1" as never,
    companyRuc: "20123456789",
    period,
    intent: "reconcile",
    label: state,
    state,
    createdBy: actor,
    createdAt: { iso: "2026-06-01T00:00:00.000Z", unix: 1 },
    updatedAt: { iso: "2026-06-01T00:00:00.000Z", unix: 1 },
  };
}

describe("Workspace", () => {
  it("creates a queued workspace with its fiscal scope", () => {
    const workspace = createWorkspace();

    expect(workspace.state).toBe("queued");
    expect(workspace.intent).toBe("reconcile");
    expect(workspace.scope).toEqual({
      organizationId: "org-1",
      companyId: "company-1",
      companyRuc: "20123456789",
      fiscalPeriod: "2026-06",
    });
  });

  it("moves through queued → working → verifying → completed", () => {
    const completed = createWorkspace().start().verify().markCompleted();

    expect(completed.state).toBe("completed");
    expect(completed.completedAt).toBeDefined();
    expect(completed.isTerminal).toBe(true);
  });

  it("supports valid waiting and retry transitions", () => {
    const resumed = createWorkspace().start().waitForEvidence().start();
    expect(resumed.state).toBe("working");
  });

  it("rejects invalid transitions with FeosError", () => {
    const queued = createWorkspace();
    expect(() => queued.verify()).toThrow(FeosError);
    expect(() => queued.verify()).toThrow(/Cannot transition/);
    expect(() => queued.markCompleted()).toThrow(FeosError);
  });

  it("blocks with blocking info and unblocks back to queued", () => {
    const blocked = createWorkspace().block(
      "Awaiting source workspace",
      ["dependency-1" as never],
      actor,
      "Upload the missing statement",
    );

    expect(blocked.state).toBe("blocked");
    expect(blocked.blocking).toMatchObject({
      reason: "Awaiting source workspace",
      blockedBy: ["dependency-1"],
      blockedByActor: actor,
      unblockInstructions: "Upload the missing statement",
    });
    expect(blocked.unblock().state).toBe("queued");
    expect(blocked.unblock().blocking).toBeUndefined();
  });

  it("marks an observed workspace unknown and resolves it", () => {
    const unknown = createWorkspace().markUnknown("State could not be synchronized");

    expect(unknown.state).toBe("unknown");
    expect(unknown.blocking?.reason).toBe("State could not be synchronized");
    expect(unknown.resolveFromUnknown("queued").state).toBe("queued");
    expect(unknown.resolveFromUnknown("failed").state).toBe("failed");
  });

  it("exposes health, terminal, and state-group getters", () => {
    expect(createWorkspace().isHealthy).toBe(true);
    expect(createWorkspace().stateGroup).toBe("active");
    expect(Workspace.fromProps(props("waiting-approval")).stateGroup).toBe("waiting");
    expect(Workspace.fromProps(props("blocked")).isHealthy).toBe(false);
    expect(Workspace.fromProps(props("failed")).isTerminal).toBe(true);
    expect(Workspace.fromProps(props("unknown")).stateGroup).toBe("unknown");
  });

  it("computes rollups for mixed workspace states", () => {
    const rollup = computePortfolioRollup([
      props("queued"), props("working"), props("waiting-input"), props("blocked"),
      props("completed"), props("failed"), props("unknown"),
    ]);

    expect(rollup).toEqual({ total: 7, active: 2, waiting: 1, blocked: 1, completed: 1, failed: 1, unknown: 1 });
  });
});
