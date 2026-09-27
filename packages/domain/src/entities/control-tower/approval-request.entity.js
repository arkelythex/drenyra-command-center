import { validateApprovalDecision, validateApprovalRequestProps, } from "./validators";
export class ApprovalRequest {
    props;
    constructor(props) {
        this.props = props;
        validateApprovalRequestProps(this.props);
        Object.freeze(this);
    }
    static create(props) {
        return new ApprovalRequest(props);
    }
    static fromPrimitives(data) {
        const props = {
            id: data.id,
            caseId: data.caseId,
            scope: {
                companyId: data.scope.companyId,
                companyRuc: data.scope.companyRuc,
                organizationId: data.scope.organizationId,
                period: data.scope.period,
                countryCode: data.scope.countryCode,
            },
            status: data.status,
            title: data.title,
            description: data.description,
            autonomyLevel: data.autonomyLevel,
            requestedBy: data.requestedBy,
            requestedAt: data.requestedAt instanceof Date
                ? data.requestedAt
                : new Date(data.requestedAt),
            decidedBy: data.decidedBy,
            decidedAt: data.decidedAt
                ? data.decidedAt instanceof Date
                    ? data.decidedAt
                    : new Date(data.decidedAt)
                : undefined,
            decisionReason: data.decisionReason,
            diff: data.diff,
            metadata: data.metadata ?? {},
        };
        return new ApprovalRequest(props);
    }
    approve(decidedBy, reason) {
        validateApprovalDecision(this.props.status, "APPROVED");
        return new ApprovalRequest({
            ...this.props,
            status: "APPROVED",
            decidedBy,
            decidedAt: new Date(),
            decisionReason: reason,
        });
    }
    reject(decidedBy, reason) {
        validateApprovalDecision(this.props.status, "REJECTED");
        return new ApprovalRequest({
            ...this.props,
            status: "REJECTED",
            decidedBy,
            decidedAt: new Date(),
            decisionReason: reason,
        });
    }
    equals(other) {
        if (!other)
            return false;
        return this.props.id === other.props.id;
    }
    isDecided() {
        return this.props.status !== "PENDING";
    }
    get id() {
        return this.props.id;
    }
    get caseId() {
        return this.props.caseId;
    }
    get scope() {
        return this.props.scope;
    }
    get status() {
        return this.props.status;
    }
    get title() {
        return this.props.title;
    }
    get description() {
        return this.props.description;
    }
    get autonomyLevel() {
        return this.props.autonomyLevel;
    }
    get requestedBy() {
        return this.props.requestedBy;
    }
    get requestedAt() {
        return this.props.requestedAt;
    }
    get decidedBy() {
        return this.props.decidedBy;
    }
    get decidedAt() {
        return this.props.decidedAt;
    }
    get decisionReason() {
        return this.props.decisionReason;
    }
    get diff() {
        return this.props.diff;
    }
    get metadata() {
        return { ...this.props.metadata };
    }
    toJSON() {
        return {
            id: this.props.id,
            caseId: this.props.caseId,
            scope: this.props.scope,
            status: this.props.status,
            title: this.props.title,
            description: this.props.description,
            autonomyLevel: this.props.autonomyLevel,
            requestedBy: this.props.requestedBy,
            requestedAt: this.props.requestedAt.toISOString(),
            decidedBy: this.props.decidedBy,
            decidedAt: this.props.decidedAt?.toISOString(),
            decisionReason: this.props.decisionReason,
            diff: this.props.diff,
            metadata: this.props.metadata,
        };
    }
}
//# sourceMappingURL=approval-request.entity.js.map