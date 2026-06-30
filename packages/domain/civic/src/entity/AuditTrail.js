import { randomUUID } from "node:crypto";
export class AuditTrail {
    props;
    constructor(props) {
        this.props = props;
        Object.freeze(this);
    }
    static create(props) {
        return new AuditTrail({
            id: props.id ?? randomUUID(),
            actId: props.actId,
            action: props.action,
            actor: props.actor,
            timestamp: props.timestamp,
            evidence: props.evidence ?? [],
            metadata: props.metadata ?? {},
            createdAt: props.createdAt ?? new Date(),
        });
    }
    addEvidence(evidenceHash) {
        return new AuditTrail({
            ...this.props,
            evidence: [...this.props.evidence, evidenceHash],
        });
    }
    addMetadata(key, value) {
        return new AuditTrail({
            ...this.props,
            metadata: { ...this.props.metadata, [key]: value },
        });
    }
    get id() {
        return this.props.id;
    }
    get actId() {
        return this.props.actId;
    }
    get action() {
        return this.props.action;
    }
    get actor() {
        return this.props.actor;
    }
    get timestamp() {
        return this.props.timestamp;
    }
    get evidence() {
        return this.props.evidence ?? [];
    }
    get metadata() {
        return { ...this.props.metadata };
    }
    get createdAt() {
        return this.props.createdAt;
    }
    toJSON() {
        return {
            id: this.props.id,
            actId: this.props.actId,
            action: this.props.action,
            actor: this.props.actor,
            timestamp: this.props.timestamp.toISOString(),
            evidence: [...(this.props.evidence ?? [])],
            metadata: { ...this.props.metadata },
            createdAt: this.props.createdAt?.toISOString(),
        };
    }
}
//# sourceMappingURL=AuditTrail.js.map