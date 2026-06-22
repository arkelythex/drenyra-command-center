import { describe, expect, it } from "vitest";
import { ApprovalWorkflow } from "../../src/harness/approval.js";

describe("ApprovalWorkflow", () => {
  it("detects tasks requiring approval via configurable gates", () => {
    const workflow = new ApprovalWorkflow();

    workflow.addGate({
      name: "submit-gate",
      description: "Submit operations require approval",
      condition: (task) => task.toLowerCase().includes("submit"),
    });

    expect(workflow.taskRequiresApproval("submit report")).toBe(true);
    expect(workflow.taskRequiresApproval("review document")).toBe(false);
  });

  it("honors the agentRequiresApproval flag", () => {
    const workflow = new ApprovalWorkflow();

    // No gates registered — only the flag triggers approval
    expect(workflow.taskRequiresApproval("anything", true)).toBe(true);
    expect(workflow.taskRequiresApproval("anything", false)).toBe(false);
  });

  it("evaluates gates and returns results", async () => {
    const workflow = new ApprovalWorkflow();

    workflow.addGate({
      name: "critical-action",
      description: "Critical actions require approval",
      condition: (task) => task.toLowerCase().includes("critical"),
      handler: async () => true,
    });

    const results = await workflow.evaluate({
      agentId: "agent-1",
      task: "perform critical action",
      runId: "run-1",
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.gate).toBe("critical-action");
    expect(results[0]?.approved).toBe(true);
  });

  it("returns default auto-approval when no gates match", async () => {
    const workflow = new ApprovalWorkflow();

    workflow.addGate({
      name: "submit-gate",
      description: "Only submit needs approval",
      condition: (task) => task.toLowerCase().includes("submit"),
    });

    const results = await workflow.evaluate({
      agentId: "agent-1",
      task: "review document",
      runId: "run-1",
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.gate).toBe("__default__");
    expect(results[0]?.approved).toBe(true);
  });

  it("rejects when a matching gate has no handler", async () => {
    const workflow = new ApprovalWorkflow();

    workflow.addGate({
      name: "human-gate",
      description: "Requires human intervention",
      condition: () => true,
      // no handler
    });

    const results = await workflow.evaluate({
      agentId: "agent-1",
      task: "anything",
      runId: "run-1",
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.approved).toBe(false);
    expect(results[0]?.reason).toContain("no handler");
  });

  it("supports adding and removing gates", () => {
    const workflow = new ApprovalWorkflow();

    workflow.addGate({
      name: "gate-1",
      description: "First gate",
      condition: () => false,
    });
    workflow.addGate({
      name: "gate-2",
      description: "Second gate",
      condition: () => false,
    });

    expect(workflow.getGates()).toHaveLength(2);

    workflow.removeGate("gate-1");
    expect(workflow.getGates()).toHaveLength(1);
    expect(workflow.getGates()[0]?.name).toBe("gate-2");
  });

  it("clears all gates", () => {
    const workflow = new ApprovalWorkflow();

    workflow.addGates([
      { name: "a", description: "A", condition: () => false },
      { name: "b", description: "B", condition: () => false },
    ]);

    expect(workflow.getGates()).toHaveLength(2);
    workflow.clear();
    expect(workflow.getGates()).toHaveLength(0);
  });
});
