import { validateAuditEventProps } from "./validators";
export class AuditEvent {
    props;
    constructor(props) {
        this.props = props;
        validateAuditEventProps(this.props);
        Object.freeze(this);
    }
    static create(props) {
        return new AuditEvent(props);
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
            eventType: data.eventType,
            actorId: data.actorId,
            message: data.message,
            occurredAt: data.occurredAt instanceof Date
                ? data.occurredAt
                : new Date(data.occurredAt),
            metadata: data.metadata ?? {},
        };
        return new AuditEvent(props);
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
    get eventType() {
        return this.props.eventType;
    }
    get actorId() {
        return this.props.actorId;
    }
    get message() {
        return this.props.message;
    }
    get occurredAt() {
        return this.props.occurredAt;
    }
    get metadata() {
        return { ...this.props.metadata };
    }
    toJSON() {
        return {
            id: this.props.id,
            caseId: this.props.caseId,
            scope: this.props.scope,
            eventType: this.props.eventType,
            actorId: this.props.actorId,
            message: this.props.message,
            occurredAt: this.props.occurredAt.toISOString(),
            metadata: this.props.metadata,
        };
    }
}
//# sourceMappingURL=audit-event.entity.js.map