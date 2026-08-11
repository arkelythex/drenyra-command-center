/**
 * FEOS-003 — Portfolio Attention Rollups
 *
 * Attention model for portfolio-level supervision.
 * Uses canonical workspace states and propagates blocking status upward.
 *
 * The portfolio rollup works as follows:
 * 1. Each workspace has a state (queued, working, blocking, etc.)
 * 2. Blocked workspaces propagate up to the company level
 * 3. Company rollups propagate up to the portfolio level
 * 4. The Attention Inbox surfaces items ordered by risk × materiality × deadline
 *
 * @module @drenyra/domain/feos/attention
 */

import type {
  CompanyId,
  OrganizationId,
  PortfolioId,
  WorkspaceId,
  Timestamp,
} from "./types";
import type { PortfolioRollup } from "./workspace";
import { computePortfolioRollup } from "./workspace";
import type { WorkspaceProps } from "./workspace";

// ============================================================================
// Attention Item
// ============================================================================

export type AttentionCategory =
  | "blocked"           // Workspace is blocked
  | "approval_needed"   // Workspace waiting for approval
  | "evidence_needed"   // Workspace waiting for evidence
  | "input_needed"      // Workspace waiting for input
  | "failed"            // Workspace failed
  | "unknown"           // Workspace state unknown
  | "approaching_deadline" // Workspace approaching fiscal deadline
  | "risk_detected"     // Risk detected in workspace
  ;

export type AttentionPriority = "critical" | "high" | "medium" | "low";

export interface AttentionItem {
  id: string;
  category: AttentionCategory;
  priority: AttentionPriority;
  title: string;
  description: string;
  workspaceId: WorkspaceId;
  companyId: CompanyId;
  periodLabel: string;
  timestamp: Timestamp;
  deadline?: Timestamp | undefined;
  downstreamImpact?: string | undefined; // Description of what else is blocked
  resolutionHint?: string | undefined;   // What to do to resolve
  actionUrl?: string | undefined;        // Deep link to resolve
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Attention Inbox
// ============================================================================

export interface AttentionInbox {
  portfolioId: PortfolioId;
  organizationId: OrganizationId;
  items: AttentionItem[];
  totalItems: number;
  unreadCount: number;
  priorityBreakdown: Record<AttentionPriority, number>;
  categoryBreakdown: Record<AttentionCategory, number>;
  lastUpdated: Timestamp;
}

// ============================================================================
// Rollup from Workspaces to Attention
// ============================================================================

/**
 * Generate attention items from a set of workspace props.
 * Each workspace in a non-healthy state generates one attention item.
 */
export function generateAttentionItems(
  workspaces: WorkspaceProps[],
  deadlineMap?: Map<string, Timestamp>, // workspaceId → deadline
): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const ws of workspaces) {
    const deadline = deadlineMap?.get(ws.id);

    switch (ws.state) {
      case "blocked": {
        items.push({
          id: `attn-${ws.id}-blocked`,
          category: "blocked",
          priority: "critical",
          title: `Blocked: ${ws.label}`,
          description: ws.blocking?.reason ?? "No reason provided",
          workspaceId: ws.id,
          companyId: ws.companyId,
          periodLabel: `${ws.period.year}-${String(ws.period.month).padStart(2, "0")}`,
          timestamp: ws.blocking?.blockedSince ?? ws.updatedAt,
          deadline,
          downstreamImpact: ws.blocking?.blockedBy.length
            ? `Blocked by ${ws.blocking.blockedBy.length} workspace(s)`
            : undefined,
          resolutionHint: ws.blocking?.unblockInstructions,
          actionUrl: ws.blocking?.unblockUrl,
        });
        break;
      }

      case "waiting-approval": {
        items.push({
          id: `attn-${ws.id}-approval`,
          category: "approval_needed",
          priority: "high",
          title: `Approval needed: ${ws.label}`,
          description: `Workspace "${ws.label}" requires human approval to proceed`,
          workspaceId: ws.id,
          companyId: ws.companyId,
          periodLabel: `${ws.period.year}-${String(ws.period.month).padStart(2, "0")}`,
          timestamp: ws.updatedAt,
          deadline,
          resolutionHint: "Review and approve or reject the pending request",
        });
        break;
      }

      case "waiting-evidence": {
        items.push({
          id: `attn-${ws.id}-evidence`,
          category: "evidence_needed",
          priority: "high",
          title: `Evidence needed: ${ws.label}`,
          description: `Workspace "${ws.label}" is waiting for supporting evidence`,
          workspaceId: ws.id,
          companyId: ws.companyId,
          periodLabel: `${ws.period.year}-${String(ws.period.month).padStart(2, "0")}`,
          timestamp: ws.updatedAt,
          deadline,
          resolutionHint: "Upload or link the required evidence documents",
        });
        break;
      }

      case "waiting-input": {
        items.push({
          id: `attn-${ws.id}-input`,
          category: "input_needed",
          priority: "high",
          title: `Input needed: ${ws.label}`,
          description: `Workspace "${ws.label}" requires user input to proceed`,
          workspaceId: ws.id,
          companyId: ws.companyId,
          periodLabel: `${ws.period.year}-${String(ws.period.month).padStart(2, "0")}`,
          timestamp: ws.updatedAt,
          deadline,
          resolutionHint: "Provide the requested information",
        });
        break;
      }

      case "failed": {
        items.push({
          id: `attn-${ws.id}-failed`,
          category: "failed",
          priority: "critical",
          title: `Failed: ${ws.label}`,
          description: `Workspace "${ws.label}" has failed`,
          workspaceId: ws.id,
          companyId: ws.companyId,
          periodLabel: `${ws.period.year}-${String(ws.period.month).padStart(2, "0")}`,
          timestamp: ws.updatedAt,
          deadline,
          resolutionHint: "Investigate the failure and re-run the workspace",
        });
        break;
      }

      case "unknown": {
        items.push({
          id: `attn-${ws.id}-unknown`,
          category: "unknown",
          priority: "high",
          title: `Unknown state: ${ws.label}`,
          description: `The state of workspace "${ws.label}" cannot be determined`,
          workspaceId: ws.id,
          companyId: ws.companyId,
          periodLabel: `${ws.period.year}-${String(ws.period.month).padStart(2, "0")}`,
          timestamp: ws.updatedAt,
          deadline,
          resolutionHint: "Rediscover or re-synchronize the workspace state",
        });
        break;
      }

      default:
        // Healthy workspaces (queued, working, verifying, completed) — no attention item
        break;
    }
  }

  return items;
}

/**
 * Sort attention items by priority (critical first) then by timestamp (oldest first).
 */
export function sortAttentionItems(items: AttentionItem[]): AttentionItem[] {
  const priorityOrder: Record<AttentionPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return [...items].sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return a.timestamp.unix - b.timestamp.unix;
  });
}

/**
 * Build an AttentionInbox from workspace props.
 */
export function buildAttentionInbox(input: {
  portfolioId: PortfolioId;
  organizationId: OrganizationId;
  workspaces: WorkspaceProps[];
  deadlineMap?: Map<string, Timestamp>;
}): AttentionInbox {
  const items = sortAttentionItems(
    generateAttentionItems(input.workspaces, input.deadlineMap),
  );

  const priorityBreakdown: Record<AttentionPriority, number> = {
    critical: 0, high: 0, medium: 0, low: 0,
  };

  const categoryBreakdown: Record<AttentionCategory, number> = {
    blocked: 0, approval_needed: 0, evidence_needed: 0, input_needed: 0,
    failed: 0, unknown: 0, approaching_deadline: 0, risk_detected: 0,
  };

  for (const item of items) {
    priorityBreakdown[item.priority]++;
    categoryBreakdown[item.category]++;
  }

  return {
    portfolioId: input.portfolioId,
    organizationId: input.organizationId,
    items,
    totalItems: items.length,
    unreadCount: items.length, // All items are "unread" by default
    priorityBreakdown,
    categoryBreakdown,
    lastUpdated: { iso: new Date().toISOString(), unix: Date.now() },
  };
}

// ============================================================================
// Portfolio Command — Status Rollup
// ============================================================================

/**
 * Portfolio-level status summary for the command palette and top bar.
 */
export interface PortfolioStatus {
  organizationId: OrganizationId;
  companies: CompanyStatusSummary[];
  totalRollup: PortfolioRollup;
  attentionCount: number;
  criticalAttentionCount: number;
  lastUpdated: Timestamp;
}

export interface CompanyStatusSummary {
  companyId: CompanyId;
  companyRuc: string;
  companyName: string;
  rollup: PortfolioRollup;
  attentionCount: number;
  criticalAttentionCount: number;
}

/**
 * Build a PortfolioStatus from grouped workspace props.
 */
export function buildPortfolioStatus(input: {
  organizationId: OrganizationId;
  companies: Array<{
    companyId: CompanyId;
    companyRuc: string;
    companyName: string;
    workspaces: WorkspaceProps[];
  }>;
}): PortfolioStatus {
  const allWorkspaces = input.companies.flatMap((c) => c.workspaces);

  const companyStatuses: CompanyStatusSummary[] = input.companies.map((company) => {
    const rollup = computePortfolioRollup(company.workspaces);
    const attentionItems = generateAttentionItems(company.workspaces);
    return {
      companyId: company.companyId,
      companyRuc: company.companyRuc,
      companyName: company.companyName,
      rollup,
      attentionCount: attentionItems.length,
      criticalAttentionCount: attentionItems.filter((a) => a.priority === "critical").length,
    };
  });

  const totalRollup = computePortfolioRollup(allWorkspaces);
  const allAttention = generateAttentionItems(allWorkspaces);

  return {
    organizationId: input.organizationId,
    companies: companyStatuses,
    totalRollup,
    attentionCount: allAttention.length,
    criticalAttentionCount: allAttention.filter((a) => a.priority === "critical").length,
    lastUpdated: { iso: new Date().toISOString(), unix: Date.now() },
  };
}
