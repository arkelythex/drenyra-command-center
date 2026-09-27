import { FeosError, generateId, nowTimestamp } from "./types";
export const APPROVAL_STATUS = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
    CANCELLED: "cancelled",
    EXPIRED: "expired",
};
export class ApprovalRequest {
    props;
    constructor(props) {
        this.props = props;
        Object.freeze(this);
    }
    static create(input) {
        const now = nowTimestamp();
        const step = {
            id: generateId(),
            order: 1,
            label: `Approval for ${input.action}`,
            status: "pending",
            assignedTo: input.assignedTo,
        };
        const steps = input.riskLevel === "R3" && input.amount && input.amount > 10000
            ? [
                step,
                {
                    id: generateId(),
                    order: 2,
                    label: "Senior approval (amount > 10,000)",
                    status: "pending",
                    assignedTo: [],
                },
            ]
            : [step];
        return new ApprovalRequest({
            id: generateId(),
            title: input.title,
            description: input.description,
            action: input.action,
            riskLevel: input.riskLevel,
            candidateInput: input.candidateInput,
            expectedOutput: input.expectedOutput,
            scope: input.scope,
            requestedBy: input.requestedBy,
            status: "pending",
            steps,
            evidenceRootId: input.evidenceRootId,
            traceId: input.traceId,
            amount: input.amount,
            currency: input.currency,
            deadline: input.deadline,
            createdAt: now,
            updatedAt: now,
            expired: false,
            tags: input.tags,
            metadata: input.metadata,
        });
    }
    static fromProps(props) {
        return new ApprovalRequest(props);
    }
    get id() { return this.props.id; }
    get title() { return this.props.title; }
    get action() { return this.props.action; }
    get riskLevel() { return this.props.riskLevel; }
    get status() { return this.props.status; }
    get steps() { return this.props.steps; }
    get requestedBy() { return this.props.requestedBy; }
    get scope() { return this.props.scope; }
    get amount() { return this.props.amount; }
    get isResolved() {
        return this.props.status === "approved" || this.props.status === "rejected";
    }
    get currentStep() {
        return this.props.steps.find((s) => s.status === "pending");
    }
    get allStepsResolved() {
        return this.props.steps.every((s) => s.status !== "pending");
    }
    approve(actor, stepId) {
        if (this.props.status !== "pending") {
            throw new FeosError("APPROVAL_NOT_PENDING", `Cannot approve: request is "${this.props.status}"`, { status: this.props.status });
        }
        const targetStep = stepId
            ? this.props.steps.find((s) => s.id === stepId)
            : this.currentStep;
        if (!targetStep || targetStep.status !== "pending") {
            throw new FeosError("STEP_NOT_PENDING", `Step "${stepId ?? "current"}" is not pending`);
        }
        const now = nowTimestamp();
        const updatedSteps = this.props.steps.map((s) => s.id === targetStep.id
            ? { ...s, status: "approved", approvedBy: actor, approvedAt: now }
            : s);
        const allApproved = updatedSteps.every((s) => s.status === "approved");
        const anyRejected = updatedSteps.some((s) => s.status === "rejected");
        return new ApprovalRequest({
            ...this.props,
            steps: updatedSteps,
            status: allApproved ? "approved" : anyRejected ? "rejected" : "pending",
            updatedAt: now,
            resolvedAt: allApproved || anyRejected ? now : undefined,
        });
    }
    reject(actor, reason, stepId) {
        if (this.props.status !== "pending") {
            throw new FeosError("APPROVAL_NOT_PENDING", `Cannot reject: request is "${this.props.status}"`, { status: this.props.status });
        }
        const targetStep = stepId
            ? this.props.steps.find((s) => s.id === stepId)
            : this.currentStep;
        if (!targetStep || targetStep.status !== "pending") {
            throw new FeosError("STEP_NOT_PENDING", `Step "${stepId ?? "current"}" is not pending`);
        }
        const now = nowTimestamp();
        const updatedSteps = this.props.steps.map((s) => s.id === targetStep.id
            ? { ...s, status: "rejected", rejectedBy: actor, rejectionReason: reason, rejectedAt: now }
            : s);
        return new ApprovalRequest({
            ...this.props,
            steps: updatedSteps,
            status: "rejected",
            updatedAt: now,
            resolvedAt: now,
        });
    }
    cancel(actor) {
        if (this.props.status !== "pending") {
            throw new FeosError("APPROVAL_NOT_PENDING", `Cannot cancel: request is "${this.props.status}"`, { status: this.props.status });
        }
        const now = nowTimestamp();
        return new ApprovalRequest({
            ...this.props,
            status: "cancelled",
            updatedAt: now,
        });
    }
    expire() {
        const now = nowTimestamp();
        return new ApprovalRequest({
            ...this.props,
            status: "expired",
            expired: true,
            updatedAt: now,
        });
    }
    toProps() {
        return { ...this.props };
    }
}
export function evaluatePolicies(policies, action) {
    return policies.filter((p) => {
        if (!p.active)
            return false;
        if (p.organizationId !== action.organizationId)
            return false;
        const riskOrder = { R0: 0, R1: 1, R2: 2, R3: 3 };
        if (riskOrder[p.minRiskLevel] > riskOrder[action.riskLevel])
            return false;
        if (p.maxAmount > 0 && action.amount && action.amount > p.maxAmount) {
            return false;
        }
        return true;
    });
}
export const DRENYRA_DEFAULT_POLICIES = [
    {
        id: "policy-r0-r1",
        name: "R0/R1 — No approval required",
        description: "Read-only and low-risk actions require no approval",
        minRiskLevel: "R3",
        maxAmount: 0,
        requiresDualApproval: false,
        requiredRoles: [],
        organizationId: "*",
        active: true,
    },
    {
        id: "policy-r2-single",
        name: "R2 — Single approval required",
        description: "Strict schema actions require single approver",
        minRiskLevel: "R2",
        maxAmount: 10000,
        requiresDualApproval: false,
        requiredRoles: ["accountant"],
        organizationId: "*",
        active: true,
    },
    {
        id: "policy-r3-dual",
        name: "R3 — Dual approval for high-risk actions",
        description: "Irreversible actions require dual approval",
        minRiskLevel: "R3",
        maxAmount: 10000,
        requiresDualApproval: false,
        requiredRoles: ["accountant"],
        organizationId: "*",
        active: true,
    },
    {
        id: "policy-r3-large-amount",
        name: "R3 — Large amount requires senior approval",
        description: "Actions over 10,000 require senior accountant approval",
        minRiskLevel: "R2",
        maxAmount: 0,
        currency: "PEN",
        requiresDualApproval: true,
        requiredRoles: ["senior-accountant"],
        organizationId: "*",
        active: true,
    },
];
//# sourceMappingURL=approval.js.map