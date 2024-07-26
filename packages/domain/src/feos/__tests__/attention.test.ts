import { describe, expect, it } from "vitest";
import {
  buildAttentionInbox,
  buildPortfolioStatus,
  createPeriodRef,
  generateAttentionItems,
  sortAttentionItems,
  type WorkspaceProps,
} from "@drenyra/domain";

const actor = { id: "agent-1", type: "agent" as const, label: "Agent" };
const period = createPeriodRef(2026, 6);
const timestamp = { iso: "2026-06-01T00:00:00.000Z", unix: 1 };

function workspace(state: WorkspaceProps["state"], id = `ws-${state}`): WorkspaceProps {
  return {
    id: id as never, organizationId: "org-1" as never, companyId: "company-1" as never,
    companyRuc: "20123456789", period, intent: "reconcile", label: id, state,
    createdBy: actor, createdAt: timestamp, updatedAt: timestamp,
    blocking: state === "blocked" ? {
      reason: "Missing bank statement", blockedBy: ["dependency-1" as never],
      blockedSince: timestamp, unblockInstructions: "Upload statement", unblockUrl: "/workspaces/ws-blocked",
    } : undefined,
  };
}

describe("portfolio attention", () => {
  it("generates attention items for blocked, waiting, failed, and unknown workspaces", () => {
    const items = generateAttentionItems([
      workspace("blocked"), workspace("waiting-approval"), workspace("waiting-evidence"),
      workspace("failed"), workspace("unknown"),
    ]);

    expect(items.map((item) => item.category)).toEqual(["blocked", "approval_needed", "evidence_needed", "failed", "unknown"]);
    expect(items[0]).toMatchObject({ priority: "critical", description: "Missing bank statement", downstreamImpact: "Blocked by 1 workspace(s)" });
  });

  it("does not create attention for healthy workspaces", () => {
    expect(generateAttentionItems([workspace("queued"), workspace("working"), workspace("verifying"), workspace("completed")])).toEqual([]);
  });

  it("sorts by priority and then oldest timestamp", () => {
    const items = generateAttentionItems([workspace("waiting-approval", "newer"), workspace("blocked", "critical")]);
    const olderHigh = { ...items[0], id: "older-high", timestamp: { iso: "2026-05-01T00:00:00.000Z", unix: 0 } };
    const sorted = sortAttentionItems([items[0], items[1], olderHigh]);

    expect(sorted.map((item) => item.id)).toEqual(["attn-critical-blocked", "older-high", "attn-newer-approval"]);
  });

  it("builds a complete, prioritized attention inbox", () => {
    const inbox = buildAttentionInbox({ portfolioId: "portfolio-1" as never, organizationId: "org-1" as never, workspaces: [workspace("waiting-evidence"), workspace("blocked")] });
    expect(inbox).toMatchObject({ portfolioId: "portfolio-1", totalItems: 2, unreadCount: 2 });
    expect(inbox.items[0].priority).toBe("critical");
    expect(inbox.priorityBreakdown).toMatchObject({ critical: 1, high: 1, medium: 0, low: 0 });
    expect(inbox.categoryBreakdown).toMatchObject({ blocked: 1, evidence_needed: 1 });
  });

  it("builds portfolio status grouped by company", () => {
    const status = buildPortfolioStatus({
      organizationId: "org-1" as never,
      companies: [
        { companyId: "company-1" as never, companyRuc: "20123456789", companyName: "Alpha SAC", workspaces: [workspace("completed"), workspace("blocked")] },
        { companyId: "company-2" as never, companyRuc: "20987654321", companyName: "Beta SAC", workspaces: [{ ...workspace("failed", "beta-failed"), companyId: "company-2" as never, companyRuc: "20987654321" }] },
      ],
    });

    expect(status.totalRollup).toMatchObject({ total: 3, completed: 1, blocked: 1, failed: 1 });
    expect(status.companies).toHaveLength(2);
    expect(status.companies[0]).toMatchObject({ companyName: "Alpha SAC", attentionCount: 1, criticalAttentionCount: 1 });
    expect(status).toMatchObject({ attentionCount: 2, criticalAttentionCount: 2 });
  });
});
