import { computePortfolioRollup } from "./workspace";
export function generateAttentionItems(workspaces, deadlineMap) {
    const items = [];
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
                break;
        }
    }
    return items;
}
export function sortAttentionItems(items) {
    const priorityOrder = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
    };
    return [...items].sort((a, b) => {
        const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (pDiff !== 0)
            return pDiff;
        return a.timestamp.unix - b.timestamp.unix;
    });
}
export function buildAttentionInbox(input) {
    const items = sortAttentionItems(generateAttentionItems(input.workspaces, input.deadlineMap));
    const priorityBreakdown = {
        critical: 0, high: 0, medium: 0, low: 0,
    };
    const categoryBreakdown = {
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
        unreadCount: items.length,
        priorityBreakdown,
        categoryBreakdown,
        lastUpdated: { iso: new Date().toISOString(), unix: Date.now() },
    };
}
export function buildPortfolioStatus(input) {
    const allWorkspaces = input.companies.flatMap((c) => c.workspaces);
    const companyStatuses = input.companies.map((company) => {
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
//# sourceMappingURL=attention.js.map