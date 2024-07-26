import { describe, it, expect } from "vitest";
import { ExactCandidate, computeCandidateHash } from "../candidate-review";
import type { FiscalScope, Actor } from "../types";

const scope: FiscalScope = { organizationId: "org-1", companyId: "comp-1", companyRuc: "20123456789", fiscalPeriod: "2026-06" };
const actor: Actor = { id: "reviewer-1", type: "user", label: "Reviewer" };

describe("FEOS-005: ExactCandidate", () => {
  it("creates a draft candidate with hash", () => {
    const c = ExactCandidate.create({ title: "Post entry", description: "JE-001", action: "post_journal_entry", actionInput: { amount: 1000, account: "12" }, riskLevel: "R2", scope, createdBy: actor, traceId: "t1" });
    expect(c.status).toBe("draft");
    expect(c.candidateHash).toBeTruthy();
  });

  it("freezes and submits for review", () => {
    const c = ExactCandidate.create({ title: "Test", description: "", action: "test", actionInput: {}, riskLevel: "R1", scope, createdBy: actor, traceId: "t2" });
    const frozen = c.freeze();
    expect(frozen.status).toBe("frozen");

    const submitted = frozen.submitForReview();
    expect(submitted.status).toBe("under_review");
  });

  it("reviews and approves", () => {
    const c = ExactCandidate.create({ title: "Test", description: "", action: "test", actionInput: {}, riskLevel: "R1", scope, createdBy: actor, traceId: "t3" });
    const approved = c.freeze().submitForReview().review({ reviewer: actor, decision: "approved", comments: "OK", reviewedAt: { iso: "2026-06-01T00:00:00Z", unix: 1722000000 } });
    expect(approved.status).toBe("approved");
    expect(approved.reviews.length).toBe(1);
  });

  it("rejects candidate", () => {
    const c = ExactCandidate.create({ title: "Test", description: "", action: "test", actionInput: {}, riskLevel: "R1", scope, createdBy: actor, traceId: "t4" });
    const rejected = c.freeze().submitForReview().review({ reviewer: actor, decision: "rejected", comments: "Wrong amount", reviewedAt: { iso: "2026-06-01T00:00:00Z", unix: 1722000000 } });
    expect(rejected.status).toBe("rejected");
  });

  it("executes if revalidation passes", () => {
    const c = ExactCandidate.create({ title: "Exec", description: "", action: "test", actionInput: { key: "value" }, riskLevel: "R1", scope, createdBy: actor, traceId: "t5" });
    const approved = c.freeze().submitForReview().review({ reviewer: actor, decision: "approved", comments: "OK", reviewedAt: { iso: "2026-06-01T00:00:00Z", unix: 1722000000 } });

    const validation = approved.revalidate();
    expect(validation.passed).toBe(true);

    const executed = approved.execute();
    expect(executed.status).toBe("executed");
  });

  it("invalidates on tampered input", () => {
    const c = ExactCandidate.create({ title: "Tamper", description: "", action: "test", actionInput: { key: "original" }, riskLevel: "R1", scope, createdBy: actor, traceId: "t6" });
    const approved = c.freeze().submitForReview().review({ reviewer: actor, decision: "approved", comments: "OK", reviewedAt: { iso: "2026-06-01T00:00:00Z", unix: 1722000000 } });

    // Different input = tampered
    const tampered = approved.execute({ key: "modified" });
    expect(tampered.status).toBe("invalidated");
  });

  it("computeCandidateHash is deterministic", () => {
    const h1 = computeCandidateHash("test", { a: 1, b: 2 });
    const h2 = computeCandidateHash("test", { a: 1, b: 2 });
    expect(h1).toBe(h2);
  });
});
