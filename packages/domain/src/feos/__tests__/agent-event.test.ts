import { describe, expect, it } from "vitest";
import {
  createApprovalEvent,
  createToolEvent,
  createWorkflowEvent,
  projectWorkflowState,
} from "@drenyra/domain";

const actor = { id: "agent-1", type: "agent" as const, label: "Agent" };
const scope = { organizationId: "org-1" as never, companyId: "company-1" as never, companyRuc: "20123456789", fiscalPeriod: "2026-06" };
const base = { title: "Event", description: "Event description", actor, scope, traceId: "trace-1", workspaceId: "workspace-1" };

describe("agent events", () => {
  it.each([
    ["tool_started", "debug"], ["tool_progress", "debug"], ["tool_completed", "info"], ["tool_error", "error"],
  ] as const)("creates %s tool events with %s severity", (kind, severity) => {
    const event = createToolEvent({ ...base, kind, toolName: "reconcile", progress: { current: 1, total: 2, label: "half" } });
    expect(event).toMatchObject({ kind, severity, toolName: "reconcile", workspaceId: "workspace-1" });
    expect(event.id).toBeTruthy();
    expect(event.timestamp.unix).toBeTypeOf("number");
  });

  it("creates workflow transition and waiting events with mapped severities", () => {
    expect(createWorkflowEvent({ ...base, kind: "workflow_transition" }).severity).toBe("info");
    expect(createWorkflowEvent({ ...base, kind: "workflow_waiting" }).severity).toBe("warning");
  });

  it.each([
    ["approval_requested", "warning"], ["approval_granted", "info"], ["approval_rejected", "error"],
  ] as const)("creates %s approval events with %s severity", (kind, severity) => {
    expect(createApprovalEvent({ ...base, kind }).severity).toBe(severity);
  });

  it("projects running state and current tool from active events", () => {
    const started = createToolEvent({ ...base, kind: "tool_started", toolName: "reconcile" });
    const progress = createToolEvent({ ...base, kind: "tool_progress", toolName: "reconcile", progress: { current: 3, total: 5, label: "3 / 5" } });
    const state = projectWorkflowState([progress, started]);

    expect(state.status).toBe("running");
    expect(state.currentTool).toBe("reconcile");
    expect(state.events).toHaveLength(2);
  });

  it("projects waiting, completed, and failed workflow states", () => {
    const waiting = projectWorkflowState([createApprovalEvent({ ...base, kind: "approval_requested" })]);
    const completed = projectWorkflowState([createToolEvent({ ...base, kind: "tool_completed", toolName: "reconcile" })]);
    const failed = projectWorkflowState([createToolEvent({ ...base, kind: "tool_error", toolName: "reconcile", error: "Connection failed" })]);

    expect(waiting.status).toBe("waiting");
    expect(waiting.warnings).toBe(1);
    expect(completed.status).toBe("completed");
    expect(failed.status).toBe("failed");
    expect(failed.errors).toBe(1);
  });
});
