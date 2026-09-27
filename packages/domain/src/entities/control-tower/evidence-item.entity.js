import { validateEvidenceItemProps } from "./validators";
export class EvidenceItem {
    props;
    constructor(props) {
        this.props = props;
        validateEvidenceItemProps(this.props);
        Object.freeze(this);
    }
    static create(props) {
        return new EvidenceItem(props);
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
            type: data.type,
            title: data.title,
            summary: data.summary,
            source: data.source,
            sourceRef: data.sourceRef,
            contentHash: data.contentHash,
            addedBy: data.addedBy,
            createdAt: data.createdAt instanceof Date
                ? data.createdAt
                : new Date(data.createdAt),
            metadata: data.metadata ?? {},
        };
        return new EvidenceItem(props);
    }
    updateSummary(summary) {
        return new EvidenceItem({ ...this.props, summary });
    }
    equals(other) {
        if (!other)
            return false;
        return this.props.id === other.props.id;
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
    get type() {
        return this.props.type;
    }
    get title() {
        return this.props.title;
    }
    get summary() {
        return this.props.summary;
    }
    get source() {
        return this.props.source;
    }
    get sourceRef() {
        return this.props.sourceRef;
    }
    get contentHash() {
        return this.props.contentHash;
    }
    get addedBy() {
        return this.props.addedBy;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get metadata() {
        return { ...this.props.metadata };
    }
    toJSON() {
        return {
            id: this.props.id,
            caseId: this.props.caseId,
            scope: this.props.scope,
            type: this.props.type,
            title: this.props.title,
            summary: this.props.summary,
            source: this.props.source,
            sourceRef: this.props.sourceRef,
            contentHash: this.props.contentHash,
            addedBy: this.props.addedBy,
            createdAt: this.props.createdAt.toISOString(),
            metadata: this.props.metadata,
        };
    }
}
//# sourceMappingURL=evidence-item.entity.js.map