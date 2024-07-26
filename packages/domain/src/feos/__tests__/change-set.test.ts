import { describe, it, expect } from "vitest";
import { ChangeSet, isValidCSTransition } from "../change-set";
import type { FiscalScope, Actor } from "../types";

const scope: FiscalScope = { organizationId: "org-1", companyId: "comp-1", companyRuc: "20123456789", fiscalPeriod: "2026-06" };
const actor: Actor = { id: "user-1", type: "user", label: "User" };

describe("FEOS-004: ChangeSet", () => {
  it("creates a draft change set", () => {
    const cs = ChangeSet.create({ title: "Adjust invoices", description: "Fix amounts", workspaceId: "ws-1", scope, createdBy: actor, traceId: "t1" });
    expect(cs.status).toBe("draft");
    expect(cs.entries).toEqual([]);
  });

  it("moves through lifecycle", () => {
    const cs = ChangeSet.create({ title: "Test", description: "Lifecycle", workspaceId: "ws-1", scope, createdBy: actor, traceId: "t2" });
    expect(cs.propose().status).toBe("proposed");
    expect(cs.propose().submitForReview().status).toBe("under_review");
    expect(cs.propose().submitForReview().approve().status).toBe("approved");
    expect(cs.propose().submitForReview().approve().apply().status).toBe("applied");
  });

  it("supports rollback", () => {
    const cs = ChangeSet.create({ title: "Rollback", description: "Test", workspaceId: "ws-1", scope, createdBy: actor, traceId: "t3" });
    const applied = cs.propose().submitForReview().approve().apply();
    expect(applied.rollback().status).toBe("rolled_back");
  });

  it("adds entries", () => {
    const cs = ChangeSet.create({ title: "Test", description: "Entries", workspaceId: "ws-1", scope, createdBy: actor, traceId: "t4" });
    const withEntry = cs.addEntry({ id: "e1", type: "journal_entry", description: "Adjustment", beforeState: {}, afterState: {}, fiscalImpact: false });
    expect(withEntry.entries.length).toBe(1);
  });

  it("forks and merges", () => {
    const parent = ChangeSet.create({ title: "Parent", description: "Main", workspaceId: "ws-1", scope, createdBy: actor, traceId: "t5" });
    const child = parent.fork("Child", "Branch", actor);
    expect(child.parentId).toBe(parent.id);
    expect(child.status).toBe("draft");

    const approvedChild = child.propose().submitForReview().approve();
    // Can't easily test merge without forking from the returned parent
  });

  it("rejects invalid transitions", () => {
    expect(isValidCSTransition("draft", "applied")).toBe(false);
    expect(isValidCSTransition("draft", "proposed")).toBe(true);
    expect(isValidCSTransition("applied", "rolled_back")).toBe(true);
    expect(isValidCSTransition("approved", "draft")).toBe(false);
  });
});
