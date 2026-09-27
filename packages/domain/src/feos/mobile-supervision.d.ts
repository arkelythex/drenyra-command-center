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
export declare class MobileSupervision {
    private notifications;
    private actions;
    addNotification(n: MobileNotification): void;
    getNotifications(filter?: {
        unreadOnly?: boolean;
    }): MobileNotification[];
    markRead(id: string): void;
    recordAction(action: MobileApprovalAction): void;
    getPendingCount(): number;
}
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
//# sourceMappingURL=mobile-supervision.d.ts.map