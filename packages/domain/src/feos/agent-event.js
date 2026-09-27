export const EVENT_SEVERITY = {
    DEBUG: "debug",
    INFO: "info",
    WARNING: "warning",
    ERROR: "error",
    CRITICAL: "critical",
};
export function createToolEvent(input) {
    const severity = input.kind === "tool_error" ? "error"
        : input.kind === "tool_completed" ? "info"
            : "debug";
    return {
        id: crypto.randomUUID(),
        kind: input.kind,
        severity,
        title: input.title,
        description: input.error || input.description,
        actor: input.actor,
        scope: input.scope,
        timestamp: { iso: new Date().toISOString(), unix: Date.now() },
        traceId: input.traceId,
        workspaceId: input.workspaceId,
        toolName: input.toolName,
        toolRiskLevel: input.toolRiskLevel,
        progress: input.progress,
        payload: {
            ...input.payload,
            ...(input.error ? { error: input.error } : {}),
        },
    };
}
export function createWorkflowEvent(input) {
    return {
        id: crypto.randomUUID(),
        kind: input.kind,
        severity: input.kind === "workflow_waiting" ? "warning" : "info",
        title: input.title,
        description: input.description,
        actor: input.actor,
        scope: input.scope,
        timestamp: { iso: new Date().toISOString(), unix: Date.now() },
        traceId: input.traceId,
        workspaceId: input.workspaceId,
        payload: input.payload,
    };
}
export function createApprovalEvent(input) {
    const severityMap = {
        approval_requested: "warning",
        approval_granted: "info",
        approval_rejected: "error",
    };
    return {
        id: crypto.randomUUID(),
        kind: input.kind,
        severity: severityMap[input.kind] ?? "info",
        title: input.title,
        description: input.description,
        actor: input.actor,
        scope: input.scope,
        timestamp: { iso: new Date().toISOString(), unix: Date.now() },
        traceId: input.traceId,
        workspaceId: input.workspaceId,
        payload: input.payload,
    };
}
export function projectWorkflowState(events) {
    if (events.length === 0) {
        throw new Error("Cannot project state from empty event list");
    }
    const sorted = [...events].sort((a, b) => a.timestamp.unix - b.timestamp.unix);
    const last = sorted[sorted.length - 1];
    const hasErrors = sorted.some((e) => e.severity === "error" || e.severity === "critical");
    const hasApprovalRequest = sorted.some((e) => e.kind === "approval_requested");
    let status;
    if (last.kind === "tool_error" || last.severity === "critical") {
        status = "failed";
    }
    else if (hasApprovalRequest || last.kind === "workflow_waiting") {
        status = "waiting";
    }
    else if (last.kind === "tool_completed" && !hasApprovalRequest) {
        status = "completed";
    }
    else {
        status = "running";
    }
    const lastToolEvent = [...sorted].reverse().find((e) => e.toolName && (e.kind === "tool_started" || e.kind === "tool_progress"));
    return {
        workspaceId: last.workspaceId ?? "unknown",
        status,
        currentTool: lastToolEvent?.toolName,
        progress: last.progress,
        lastEvent: last,
        events: sorted,
        warnings: sorted.filter((e) => e.severity === "warning").length,
        errors: hasErrors ? sorted.filter((e) => e.severity === "error" || e.severity === "critical").length : 0,
        startedAt: sorted[0].timestamp,
        lastUpdated: last.timestamp,
    };
}
//# sourceMappingURL=agent-event.js.map