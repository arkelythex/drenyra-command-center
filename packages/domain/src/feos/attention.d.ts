import type { CompanyId, OrganizationId, PortfolioId, WorkspaceId, Timestamp } from "./types";
import type { PortfolioRollup } from "./workspace";
import type { WorkspaceProps } from "./workspace";
export type AttentionCategory = "blocked" | "approval_needed" | "evidence_needed" | "input_needed" | "failed" | "unknown" | "approaching_deadline" | "risk_detected";
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
    deadline?: Timestamp;
    downstreamImpact?: string;
    resolutionHint?: string;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
}
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
export declare function generateAttentionItems(workspaces: WorkspaceProps[], deadlineMap?: Map<string, Timestamp>): AttentionItem[];
export declare function sortAttentionItems(items: AttentionItem[]): AttentionItem[];
export declare function buildAttentionInbox(input: {
    portfolioId: PortfolioId;
    organizationId: OrganizationId;
    workspaces: WorkspaceProps[];
    deadlineMap?: Map<string, Timestamp>;
}): AttentionInbox;
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
export declare function buildPortfolioStatus(input: {
    organizationId: OrganizationId;
    companies: Array<{
        companyId: CompanyId;
        companyRuc: string;
        companyName: string;
        workspaces: WorkspaceProps[];
    }>;
}): PortfolioStatus;
//# sourceMappingURL=attention.d.ts.map