/**
 * FEOS-013 — Mobile Supervision and Approval
 *
 * Lightweight mobile monitoring and approval for financial professionals.
 * Designed for low-bandwidth, high-impact interactions.
 *
 * @module @drenyra/domain/feos/mobile-supervision
 */

import type { Actor, Timestamp } from "./types";
    
export type NotificationPriority = "urgent" | "high" | "normal" | "low";

export interface MobileNotification {
  id: string;
  title: string;
  body: string;
  priority: NotificationPriority;
  category: "approval" | "attention" | "alert" | "status";
  actionUrl?: string;
  approvalRequestId?: string;
  workspaceId?: string;
  companyName?: string;
  read: boolean;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}

export interface MobileApprovalAction {
  approvalRequestId: string;
  decision: "approved" | "rejected";
  comments?: string;
  approvedBy: Actor;
  timestamp: Timestamp;
}

export class MobileSupervision {
  private notifications: MobileNotification[] = [];
  private actions: MobileApprovalAction[] = [];

  addNotification(n: MobileNotification): void {
    this.notifications.push(n);
  }

  getNotifications(filter?: { unreadOnly?: boolean }): MobileNotification[] {
    let result = this.notifications;
    if (filter?.unreadOnly) result = result.filter((n) => !n.read);
    return [...result].sort((a, b) => b.createdAt.unix - a.createdAt.unix);
  }

  markRead(id: string): void {
    const n = this.notifications.find((n) => n.id === id);
    if (n) n.read = true;
  }

  recordAction(action: MobileApprovalAction): void {
    this.actions.push(action);
  }

  getPendingCount(): number {
    return this.notifications.filter((n) => !n.read && n.priority === "urgent").length;
  }
}

// ============================================================================
// Supervisor Dashboard — lightweight status for mobile
// ============================================================================

export interface SupervisorDashboard {
  companies: MobileCompanySummary[];
  urgentNotifications: number;
  pendingApprovals: number;
  blockedWorkspaces: number;
  lastUpdated: Timestamp;
}

export interface MobileCompanySummary {
  companyId: string;
  companyName: string;
  status: "healthy" | "attention" | "critical";
  attentionCount: number;
}
