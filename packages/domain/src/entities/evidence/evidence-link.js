export class EvidenceLink {
    id;
    evidenceId;
    entityType;
    entityId;
    relationship;
    linkedBy;
    linkedAt;
    metadata;
    constructor(id, evidenceId, entityType, entityId, relationship, linkedBy, linkedAt, metadata) {
        this.id = id;
        this.evidenceId = evidenceId;
        this.entityType = entityType;
        this.entityId = entityId;
        this.relationship = relationship;
        this.linkedBy = linkedBy;
        this.linkedAt = linkedAt;
        this.metadata = metadata;
    }
    static create(props) {
        return new EvidenceLink(props.id, props.evidenceId, props.entityType, props.entityId, props.relationship, props.linkedBy, props.linkedAt, props.metadata ?? {});
    }
    static reconstitute(data) {
        return new EvidenceLink(data.id, data.evidenceId, data.entityType, data.entityId, data.relationship, data.linkedBy, data.linkedAt, data.metadata ?? {});
    }
}
//# sourceMappingURL=evidence-link.js.map