import { describe, it, expect } from "vitest";
import { ApprovalRequest, evaluatePolicies, DRENYRA_DEFAULT_POLICIES, APPROVAL_STATUS } from "../approval";
import type { FiscalScope, Actor } from "../types";
import { FeosError } from "../types";

const testScope: FiscalScope = {
  organizationId: "org-1",
  companyId: "comp-1",
  companyRuc: "20123456789",
  fiscalPeriod: "2026-06",
};

const testActor: Actor = { id: "user-1", type: "user", label: "Test User" };
const seniorActor: Actor = { id: "user-2", type: "user", label: "Senior User" };

describe("ApprovalRequest", () => {
  it("creates a pending approval request", () => {
    const req = ApprovalRequest.create({
      title: "Approve close",
      description: "Close June 2026",
      action: "approve_close",
      riskLevel: "R2",
      candidateInput: { period: "2026-06" },
      scope: testScope,
      requestedBy: testActor,
      assignedTo: [seniorActor],
      traceId: "trace-1",
    });

    expect(req.id).toBeDefined();
    expect(req.status).toBe("pending");
    expect(req.steps).toHaveLength(1);
    expect(req.currentStep).toBeDefined();
    expect(req.currentStep!.status).toBe("pending");
  });

  it("creates dual-step for high-value R3 requests", () => {
    const req = ApprovalRequest.create({
      title: "Large payment",
      description: "Payment over 10k",
      action: "initiate_payment",
      riskLevel: "R3",
      candidateInput: { amount: 15000 },
      scope: testScope,
      requestedBy: testActor,
      assignedTo: [testActor],
      traceId: "trace-2",
      amount: 15000,
    });

    expect(req.steps).toHaveLength(2);
  });

  it("approves a request through single step", () => {
    const req = ApprovalRequest.create({
      title: "Approve entry",
      description: "Post journal entry",
      action: "post_journal_entry",
      riskLevel: "R2",
      candidateInput: {},
      scope: testScope,
      requestedBy: testActor,
      assignedTo: [seniorActor],
      traceId: "trace-3",
    });

    const approved = req.approve(seniorActor);
    expect(approved.status).toBe("approved");
    expect(approved.steps[0].status).toBe("approved");
    expect(approved.steps[0].approvedBy?.id).toBe("user-2");
  });

  it("rejects a request", () => {
    const req = ApprovalRequest.create({
      title: "Reject entry",
      description: "Invalid journal entry",
      action: "post_journal_entry",
      riskLevel: "R2",
      candidateInput: {},
      scope: testScope,
      requestedBy: testActor,
      assignedTo: [seniorActor],
      traceId: "trace-4",
    });

    const rejected = req.reject(seniorActor, "Amount exceeds limit");
    expect(rejected.status).toBe("rejected");
    expect(rejected.steps[0].status).toBe("rejected");
    expect(rejected.steps[0].rejectionReason).toBe("Amount exceeds limit");
  });

  it("cancels a pending request", () => {
    const req = ApprovalRequest.create({
      title: "Cancel test",
      description: "Test cancellation",
      action: "test",
      riskLevel: "R1",
      candidateInput: {},
      scope: testScope,
      requestedBy: testActor,
      assignedTo: [testActor],
      traceId: "trace-5",
    });

    const cancelled = req.cancel(testActor);
    expect(cancelled.status).toBe("cancelled");
  });

  it("prevents approving already resolved request", () => {
    const req = ApprovalRequest.create({
      title: "Double approve",
      description: "Test",
      action: "test",
      riskLevel: "R1",
      candidateInput: {},
      scope: testScope,
      requestedBy: testActor,
      assignedTo: [testActor],
      traceId: "trace-6",
    });

    const approved = req.approve(testActor);
    expect(() => approved.approve(testActor)).toThrow(FeosError);
  });

  it("prevents rejecting non-pending step", () => {
    const req = ApprovalRequest.create({
      title: "Double reject",
      description: "Test",
      action: "test",
      riskLevel: "R1",
      candidateInput: {},
      scope: testScope,
      requestedBy: testActor,
      assignedTo: [testActor],
      traceId: "trace-7",
    });

    const rejected = req.reject(testActor, "No reason");
    expect(() => rejected.reject(testActor, "Again")).toThrow(FeosError);
  });

  it("expires a request", () => {
    const req = ApprovalRequest.create({
      title: "Expire test",
      description: "Test expiry",
      action: "test",
      riskLevel: "R1",
      candidateInput: {},
      scope: testScope,
      requestedBy: testActor,
      assignedTo: [testActor],
      traceId: "trace-8",
    });

    const expired = req.expire();
    expect(expired.status).toBe("expired");
    expect(expired.isResolved).toBe(false); // expired is not resolved
  });
});

describe("evaluatePolicies", () => {
  it("returns matching policies for risk level", () => {
    const result = evaluatePolicies(DRENYRA_DEFAULT_POLICIES, {
      riskLevel: "R2",
      amount: 5000,
      organizationId: "*",
    });

    expect(result.length).toBeGreaterThan(0);
  });

  it("returns no policies for R0", () => {
    const result = evaluatePolicies(DRENYRA_DEFAULT_POLICIES, {
      riskLevel: "R0",
      organizationId: "*",
    });

    // R0 has no matching policies since minRiskLevel for all is R2+
    const hasR0 = result.some((p) => p.id === "policy-r0-r1");
    expect(hasR0).toBe(false);
  });
});
