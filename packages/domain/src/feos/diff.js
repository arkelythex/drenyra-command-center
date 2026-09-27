import { FeosError, generateId, nowTimestamp } from "./types";
export class FinancialDiff {
    props;
    constructor(props) {
        this.props = props;
        Object.freeze(this);
    }
    static create(input) {
        const severity = computeSeverity(input.impact);
        const now = nowTimestamp();
        return new FinancialDiff({
            id: generateId(),
            title: input.title,
            description: input.description,
            category: input.category,
            severity,
            status: "draft",
            beforeState: input.beforeState,
            afterState: input.afterState,
            changes: input.changes,
            impact: input.impact,
            evidence: input.evidence ?? [],
            reviews: [],
            scope: input.scope,
            createdBy: input.createdBy,
            workspaceId: input.workspaceId,
            traceId: input.traceId,
            createdAt: now,
            updatedAt: now,
            tags: input.tags,
            metadata: input.metadata,
        });
    }
    static fromProps(props) {
        return new FinancialDiff(props);
    }
    get id() { return this.props.id; }
    get title() { return this.props.title; }
    get status() { return this.props.status; }
    get severity() { return this.props.severity; }
    get impact() { return this.props.impact; }
    get changes() { return this.props.changes; }
    get evidence() { return this.props.evidence; }
    get reviews() { return this.props.reviews; }
    get scope() { return this.props.scope; }
    get approvalRequestId() { return this.props.approvalRequestId; }
    get isResolved() {
        return this.props.status === "approved"
            || this.props.status === "rejected"
            || this.props.status === "applied";
    }
    toProps() {
        return { ...this.props };
    }
    transition(to) {
        if (!isValidDiffTransition(this.props.status, to)) {
            throw new FeosError("INVALID_DIFF_TRANSITION", `Cannot transition from "${this.props.status}" to "${to}"`, { from: this.props.status, to });
        }
        return new FinancialDiff({
            ...this.props,
            status: to,
            updatedAt: nowTimestamp(),
        });
    }
    submitForReview() {
        return this.transition("ready_for_review");
    }
    startReview() {
        return this.transition("under_review");
    }
    approve(review) {
        const updated = this.transition("approved");
        return new FinancialDiff({
            ...updated.props,
            reviews: [...updated.props.reviews, review],
        });
    }
    reject(review) {
        const updated = this.transition("rejected");
        return new FinancialDiff({
            ...updated.props,
            reviews: [...updated.props.reviews, review],
        });
    }
    markApplied() {
        return this.transition("applied");
    }
    cancel() {
        return this.transition("cancelled");
    }
    linkApproval(approvalRequestId) {
        return new FinancialDiff({
            ...this.props,
            approvalRequestId,
            updatedAt: nowTimestamp(),
        });
    }
    addEvidence(item) {
        return new FinancialDiff({
            ...this.props,
            evidence: [...this.props.evidence, item],
            updatedAt: nowTimestamp(),
        });
    }
}
const DIFF_TRANSITIONS = {
    draft: ["ready_for_review", "cancelled"],
    ready_for_review: ["under_review", "cancelled"],
    under_review: ["approved", "rejected", "cancelled"],
    approved: ["applied", "cancelled"],
    rejected: [],
    applied: [],
    cancelled: [],
};
export function isValidDiffTransition(from, to) {
    return DIFF_TRANSITIONS[from]?.includes(to) ?? false;
}
export function computeSeverity(impact) {
    if (impact.affectsFiscalReporting)
        return "critical";
    if (impact.affectsPeriodClose)
        return "high";
    if (impact.netAmount > 10000)
        return "high";
    if (impact.netAmount > 1000)
        return "medium";
    return "low";
}
export function computeDiffRiskScore(diff) {
    const props = diff instanceof FinancialDiff ? diff.toProps() : diff;
    const factors = [];
    const amount = Math.abs(props.impact.netAmount);
    if (amount > 100000) {
        factors.push({ name: "large_amount", score: 10, description: `Amount ${amount} exceeds 100,000 threshold` });
    }
    else if (amount > 10000) {
        factors.push({ name: "moderate_amount", score: 6, description: `Amount ${amount} exceeds 10,000 threshold` });
    }
    else {
        factors.push({ name: "small_amount", score: 1, description: `Amount ${amount} is under 10,000` });
    }
    if (props.impact.affectsFiscalReporting) {
        factors.push({ name: "fiscal_impact", score: 10, description: "Change affects fiscal/SIRE reporting" });
    }
    if (props.impact.affectsPeriodClose) {
        factors.push({ name: "close_impact", score: 8, description: "Change affects period close" });
    }
    const sensitiveAccounts = ["10", "20", "40", "50"];
    const sensitiveHits = props.impact.affectedAccounts.filter((a) => sensitiveAccounts.some((s) => a.startsWith(s))).length;
    if (sensitiveHits > 0) {
        factors.push({ name: "sensitive_accounts", score: Math.min(sensitiveHits * 2, 10), description: `${sensitiveHits} sensitive account(s) affected` });
    }
    const avg = factors.reduce((sum, f) => sum + f.score, 0) / factors.length;
    const overall = avg >= 8 ? "critical" : avg >= 5 ? "high" : avg >= 3 ? "medium" : "low";
    return { overall, factors };
}
//# sourceMappingURL=diff.js.map