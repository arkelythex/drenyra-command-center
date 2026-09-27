import { validateFiscalCaseProps, validateFiscalCaseTransition, } from "./validators";
export class FiscalCase {
    props;
    constructor(props) {
        this.props = props;
        validateFiscalCaseProps(this.props);
        Object.freeze(this);
    }
    static create(props) {
        return new FiscalCase(props);
    }
    static fromPrimitives(data) {
        const props = {
            id: data.id,
            scope: {
                companyId: data.scope.companyId,
                companyRuc: data.scope.companyRuc,
                organizationId: data.scope.organizationId,
                period: data.scope.period,
                countryCode: data.scope.countryCode,
            },
            type: data.type,
            status: data.status,
            title: data.title,
            description: data.description,
            riskLevel: data.riskLevel,
            riskScore: data.riskScore,
            autonomyLevel: data.autonomyLevel,
            createdBy: data.createdBy,
            createdAt: data.createdAt instanceof Date
                ? data.createdAt
                : new Date(data.createdAt),
            updatedAt: data.updatedAt instanceof Date
                ? data.updatedAt
                : new Date(data.updatedAt),
            metadata: data.metadata ?? {},
        };
        return new FiscalCase(props);
    }
    transition(newStatus) {
        validateFiscalCaseTransition(this.props.status, newStatus);
        return new FiscalCase({
            ...this.props,
            status: newStatus,
            updatedAt: new Date(),
        });
    }
    startReview() {
        return this.transition("IN_REVIEW");
    }
    requestApproval() {
        return this.transition("APPROVAL_PENDING");
    }
    resolve() {
        return this.transition("RESOLVED");
    }
    archive() {
        return this.transition("ARCHIVED");
    }
    updateRisk(riskLevel, riskScore) {
        if (riskScore < 0 || riskScore > 100) {
            throw new Error("Risk score must be between 0 and 100");
        }
        return new FiscalCase({
            ...this.props,
            riskLevel,
            riskScore,
            updatedAt: new Date(),
        });
    }
    updateMetadata(metadata) {
        return new FiscalCase({
            ...this.props,
            metadata: { ...this.props.metadata, ...metadata },
            updatedAt: new Date(),
        });
    }
    equals(other) {
        if (!other)
            return false;
        return this.props.id === other.props.id;
    }
    get id() {
        return this.props.id;
    }
    get scope() {
        return this.props.scope;
    }
    get type() {
        return this.props.type;
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
    get riskLevel() {
        return this.props.riskLevel;
    }
    get riskScore() {
        return this.props.riskScore;
    }
    get autonomyLevel() {
        return this.props.autonomyLevel;
    }
    get createdBy() {
        return this.props.createdBy;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    get metadata() {
        return { ...this.props.metadata };
    }
    toJSON() {
        return {
            id: this.props.id,
            scope: this.props.scope,
            type: this.props.type,
            status: this.props.status,
            title: this.props.title,
            description: this.props.description,
            riskLevel: this.props.riskLevel,
            riskScore: this.props.riskScore,
            autonomyLevel: this.props.autonomyLevel,
            createdBy: this.props.createdBy,
            createdAt: this.props.createdAt.toISOString(),
            updatedAt: this.props.updatedAt.toISOString(),
            metadata: this.props.metadata,
        };
    }
}
//# sourceMappingURL=fiscal-case.entity.js.map