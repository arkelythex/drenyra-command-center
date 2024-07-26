import { describe, it, expect } from "vitest";
import { FinancialDiff, computeDiffRiskScore, computeSeverity, isValidDiffTransition } from "../diff";
import type { FinancialImpact, DiffChange } from "../diff";
import type { FiscalScope, Actor } from "../types";
import { FeosError } from "../types";

const testScope: FiscalScope = {
  organizationId: "org-1",
  companyId: "comp-1",
  companyRuc: "20123456789",
  fiscalPeriod: "2026-06",
};

const testActor: Actor = { id: "user-1", type: "user", label: "Test User" };

const sampleChanges: DiffChange[] = [
  { id: "c1", field: "amount", before: 100, after: 150, label: "Increase amount", amount: 50, fiscalImpact: false },
];

const sampleImpact: FinancialImpact = {
  netAmount: 50,
  currency: "PEN",
  totalDebit: 50,
  totalCredit: 0,
  affectsFiscalReporting: false,
  affectsCashFlow: false,
  affectsPeriodClose: false,
  affectedAccounts: ["12"],
  summary: "Increase amount by 50",
};

describe("FinancialDiff", () => {
  it("creates a draft diff", () => {
    const diff = FinancialDiff.create({
      title: "Adjust invoice 001",
      description: "Correct amount on invoice",
      category: "invoice",
      beforeState: { amount: 100 },
      afterState: { amount: 150 },
      changes: sampleChanges,
      impact: sampleImpact,
      scope: testScope,
      createdBy: testActor,
      traceId: "trace-1",
    });

    expect(diff.id).toBeDefined();
    expect(diff.status).toBe("draft");
    expect(diff.severity).toBe("low");
  });

  it("moves through review lifecycle", () => {
    const diff = FinancialDiff.create({
      title: "Test lifecycle",
      description: "Full lifecycle test",
      category: "journal_entry",
      beforeState: {},
      afterState: {},
      changes: sampleChanges,
      impact: sampleImpact,
      scope: testScope,
      createdBy: testActor,
      traceId: "trace-2",
    });

    const submitted = diff.submitForReview();
    expect(submitted.status).toBe("ready_for_review");

    const underReview = submitted.startReview();
    expect(underReview.status).toBe("under_review");

    const approved = underReview.approve({
      reviewedBy: testActor,
      reviewedAt: { iso: new Date().toISOString(), unix: Date.now() },
      decision: "approved",
      comments: "Looks good",
    });
    expect(approved.status).toBe("approved");
    expect(approved.reviews).toHaveLength(1);

    const applied = approved.markApplied();
    expect(applied.status).toBe("applied");
  });

  it("rejects with review record", () => {
    const diff = FinancialDiff.create({
      title: "Test rejection",
      description: "Rejection test",
      category: "other",
      beforeState: {},
      afterState: {},
      changes: sampleChanges,
      impact: sampleImpact,
      scope: testScope,
      createdBy: testActor,
      traceId: "trace-3",
    });

    const submitted = diff.submitForReview();
    const underReview = submitted.startReview();
    const rejected = underReview.reject({
      reviewedBy: testActor,
      reviewedAt: { iso: new Date().toISOString(), unix: Date.now() },
      decision: "rejected",
      comments: "Incorrect amount",
    });

    expect(rejected.status).toBe("rejected");
    expect(rejected.reviews).toHaveLength(1);
  });

  it("prevents invalid transitions", () => {
    const diff = FinancialDiff.create({
      title: "Invalid",
      description: "Invalid transition test",
      category: "other",
      beforeState: {},
      afterState: {},
      changes: sampleChanges,
      impact: sampleImpact,
      scope: testScope,
      createdBy: testActor,
      traceId: "trace-4",
    });

    expect(() => diff.markApplied()).toThrow(FeosError);
  });

  it("links approval request", () => {
    const diff = FinancialDiff.create({
      title: "Link test",
      description: "Approval linking test",
      category: "other",
      beforeState: {},
      afterState: {},
      changes: sampleChanges,
      impact: sampleImpact,
      scope: testScope,
      createdBy: testActor,
      traceId: "trace-5",
    });

    const linked = diff.linkApproval("apr-123");
    expect(linked.approvalRequestId).toBe("apr-123");
  });

  it("adds evidence", () => {
    const diff = FinancialDiff.create({
      title: "Evidence test",
      description: "Add evidence",
      category: "other",
      beforeState: {},
      afterState: {},
      changes: sampleChanges,
      impact: sampleImpact,
      scope: testScope,
      createdBy: testActor,
      traceId: "trace-6",
    });

    const withEvidence = diff.addEvidence({
      id: "ev-1", category: "document", title: "Supporting doc",
      hash: "abc123", timestamp: new Date().toISOString(),
    });

    expect(withEvidence.evidence).toHaveLength(1);
  });
});

describe("computeDiffRiskScore", () => {
  it("returns low for small non-fiscal changes", () => {
    const score = computeDiffRiskScore({
      impact: {
        netAmount: 50, currency: "PEN",
        totalDebit: 50, totalCredit: 0,
        affectsFiscalReporting: false,
        affectsCashFlow: false,
        affectsPeriodClose: false,
        affectedAccounts: ["12"],
        summary: "Small adjustment",
      },
    } as any);
    expect(score.overall).toBe("low");
  });

  it("returns critical for fiscal-impacting large changes", () => {
    const score = computeDiffRiskScore({
      impact: {
        netAmount: 200000, currency: "PEN",
        totalDebit: 200000, totalCredit: 0,
        affectsFiscalReporting: true,
        affectsCashFlow: false,
        affectsPeriodClose: true,
        affectedAccounts: ["10", "20", "40"],
        summary: "Large fiscal change",
      },
    } as any);
    expect(score.overall).toBe("critical");
  });
});

describe("computeSeverity", () => {
  it("returns critical for fiscal impact", () => {
    expect(computeSeverity({ ...sampleImpact, affectsFiscalReporting: true })).toBe("critical");
  });

  it("returns high for period close impact", () => {
    expect(computeSeverity({ ...sampleImpact, affectsPeriodClose: true })).toBe("high");
  });

  it("returns high for large amounts", () => {
    expect(computeSeverity({ ...sampleImpact, netAmount: 50000 })).toBe("high");
  });

  it("returns low for small amounts", () => {
    expect(computeSeverity(sampleImpact)).toBe("low");
  });
});

describe("isValidDiffTransition", () => {
  it("allows draft -> ready_for_review", () => {
    expect(isValidDiffTransition("draft", "ready_for_review")).toBe(true);
  });

  it("allows ready_for_review -> under_review", () => {
    expect(isValidDiffTransition("ready_for_review", "under_review")).toBe(true);
  });

  it("allows under_review -> approved", () => {
    expect(isValidDiffTransition("under_review", "approved")).toBe(true);
  });

  it("rejects draft -> applied", () => {
    expect(isValidDiffTransition("draft", "applied")).toBe(false);
  });

  it("allows any -> cancelled", () => {
    expect(isValidDiffTransition("draft", "cancelled")).toBe(true);
    expect(isValidDiffTransition("approved", "cancelled")).toBe(true);
  });
});
