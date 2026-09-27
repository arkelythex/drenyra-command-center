import { FeosError, generateId, nowTimestamp } from "./types";
export const WORKSPACE_STATE = {
    QUEUED: "queued",
    WORKING: "working",
    VERIFYING: "verifying",
    WAITING_INPUT: "waiting-input",
    WAITING_EVIDENCE: "waiting-evidence",
    WAITING_APPROVAL: "waiting-approval",
    BLOCKED: "blocked",
    COMPLETED: "completed",
    FAILED: "failed",
    UNKNOWN: "unknown",
};
export function getStateGroup(state) {
    switch (state) {
        case "queued":
        case "working":
        case "verifying":
            return "active";
        case "waiting-input":
        case "waiting-evidence":
        case "waiting-approval":
            return "waiting";
        case "blocked":
            return "blocked";
        case "completed":
        case "failed":
            return "terminal";
        case "unknown":
            return "unknown";
    }
}
export function isWorkspaceHealthy(state) {
    return state === "queued" || state === "working" || state === "verifying"
        || state === "completed";
}
export function isWorkspaceTerminal(state) {
    return state === "completed" || state === "failed";
}
const VALID_TRANSITIONS = {
    queued: ["working", "blocked", "failed"],
    working: ["verifying", "waiting-input", "waiting-evidence", "waiting-approval", "blocked", "failed"],
    verifying: ["completed", "waiting-approval", "blocked", "working", "failed"],
    "waiting-input": ["working", "blocked", "failed"],
    "waiting-evidence": ["working", "blocked", "failed"],
    "waiting-approval": ["working", "verifying", "blocked", "failed"],
    blocked: ["queued", "working", "failed"],
    completed: [],
    failed: [],
    unknown: ["queued", "failed"],
};
export function isValidTransition(from, to) {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
export const WORKSPACE_INTENT = {
    CLOSE: "close",
    RECONCILE: "reconcile",
    REVIEW: "review",
    INVESTIGATE: "investigate",
    CONFIGURE: "configure",
    REPORT: "report",
    AUDIT: "audit",
    SUBMISSION: "submission",
};
export class Workspace {
    props;
    constructor(props) {
        this.props = props;
        Object.freeze(this);
    }
    static create(input) {
        const now = nowTimestamp();
        return new Workspace({
            id: generateId(),
            organizationId: input.organizationId,
            companyId: input.companyId,
            companyRuc: input.companyRuc,
            period: input.period,
            intent: input.intent,
            label: input.label,
            description: input.description,
            state: "queued",
            createdBy: input.createdBy,
            createdAt: now,
            updatedAt: now,
            metadata: input.metadata,
        });
    }
    static fromProps(props) {
        return new Workspace(props);
    }
    get id() { return this.props.id; }
    get organizationId() { return this.props.organizationId; }
    get companyId() { return this.props.companyId; }
    get companyRuc() { return this.props.companyRuc; }
    get period() { return this.props.period; }
    get intent() { return this.props.intent; }
    get label() { return this.props.label; }
    get description() { return this.props.description; }
    get state() { return this.props.state; }
    get blocking() { return this.props.blocking; }
    get createdBy() { return this.props.createdBy; }
    get createdAt() { return this.props.createdAt; }
    get updatedAt() { return this.props.updatedAt; }
    get completedAt() { return this.props.completedAt; }
    get metadata() { return this.props.metadata; }
    get scope() {
        return {
            organizationId: this.props.organizationId,
            companyId: this.props.companyId,
            companyRuc: this.props.companyRuc,
            fiscalPeriod: `${this.props.period.year}-${String(this.props.period.month).padStart(2, "0")}`,
        };
    }
    get stateGroup() {
        return getStateGroup(this.state);
    }
    get isHealthy() {
        return isWorkspaceHealthy(this.state);
    }
    get isTerminal() {
        return isWorkspaceTerminal(this.state);
    }
    transition(to, extra) {
        if (!isValidTransition(this.props.state, to)) {
            throw new FeosError("INVALID_WORKSPACE_TRANSITION", `Cannot transition from "${this.props.state}" to "${to}"`, { from: this.props.state, to });
        }
        const now = nowTimestamp();
        return new Workspace({
            ...this.props,
            ...extra,
            state: to,
            updatedAt: now,
            completedAt: to === "completed" || to === "failed" ? now : this.props.completedAt,
        });
    }
    start() {
        return this.transition("working");
    }
    verify() {
        return this.transition("verifying");
    }
    markCompleted() {
        return this.transition("completed");
    }
    markFailed(error) {
        return this.transition("failed");
    }
    waitForInput() {
        return this.transition("waiting-input");
    }
    waitForEvidence() {
        return this.transition("waiting-evidence");
    }
    waitForApproval() {
        return this.transition("waiting-approval");
    }
    block(reason, blockedBy, actor, instructions) {
        return this.transition("blocked", {
            blocking: {
                reason,
                blockedBy,
                blockedSince: nowTimestamp(),
                blockedByActor: actor,
                unblockInstructions: instructions,
            },
        });
    }
    unblock(actor) {
        return this.transition("queued", {
            blocking: undefined,
        });
    }
    resolveFromUnknown(to) {
        return this.transition(to);
    }
    markUnknown(reason) {
        const now = nowTimestamp();
        return new Workspace({
            ...this.props,
            state: "unknown",
            blocking: {
                reason,
                blockedBy: [],
                blockedSince: now,
            },
            updatedAt: now,
        });
    }
    toProps() {
        return { ...this.props };
    }
}
export function computePortfolioRollup(workspaces) {
    const rollup = {
        total: workspaces.length,
        active: 0,
        waiting: 0,
        blocked: 0,
        completed: 0,
        failed: 0,
        unknown: 0,
    };
    for (const ws of workspaces) {
        switch (getStateGroup(ws.state)) {
            case "active":
                rollup.active++;
                break;
            case "waiting":
                rollup.waiting++;
                break;
            case "blocked":
                rollup.blocked++;
                break;
            case "terminal":
                if (ws.state === "completed")
                    rollup.completed++;
                else
                    rollup.failed++;
                break;
            case "unknown":
                rollup.unknown++;
                break;
        }
    }
    return rollup;
}
//# sourceMappingURL=workspace.js.map