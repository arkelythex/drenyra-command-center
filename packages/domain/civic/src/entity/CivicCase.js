import { randomUUID } from "node:crypto";
export var CivicCaseStatus;
(function (CivicCaseStatus) {
    CivicCaseStatus["DRAFT"] = "DRAFT";
    CivicCaseStatus["ACTIVE"] = "ACTIVE";
    CivicCaseStatus["COMPLETED"] = "COMPLETED";
    CivicCaseStatus["ESCALATED"] = "ESCALATED";
    CivicCaseStatus["RESOLVED"] = "RESOLVED";
})(CivicCaseStatus || (CivicCaseStatus = {}));
const VALID_TRANSITIONS = {
    [CivicCaseStatus.DRAFT]: [CivicCaseStatus.ACTIVE],
    [CivicCaseStatus.ACTIVE]: [CivicCaseStatus.COMPLETED],
    [CivicCaseStatus.COMPLETED]: [CivicCaseStatus.ESCALATED],
    [CivicCaseStatus.ESCALATED]: [CivicCaseStatus.RESOLVED],
    [CivicCaseStatus.RESOLVED]: [],
};
export class CivicCase {
    props;
    constructor(props) {
        this.props = props;
        Object.freeze(this);
    }
    static create(props) {
        return new CivicCase({
            id: props.id ?? randomUUID(),
            name: props.name,
            status: props.status ?? CivicCaseStatus.DRAFT,
            electionIds: props.electionIds ?? [],
            fraudIndicators: props.fraudIndicators ?? [],
            timeline: props.timeline ?? [],
            escalationReason: props.escalationReason,
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        });
    }
    transition(newStatus, extra) {
        const allowed = VALID_TRANSITIONS[this.props.status];
        if (!allowed.includes(newStatus)) {
            throw new Error(`Cannot transition civic case from ${this.props.status} to ${newStatus}`);
        }
        return new CivicCase({
            ...this.props,
            ...extra,
            status: newStatus,
            updatedAt: new Date(),
        });
    }
    activate() {
        return this.transition(CivicCaseStatus.ACTIVE);
    }
    complete() {
        return this.transition(CivicCaseStatus.COMPLETED);
    }
    escalate(reason) {
        if (!reason || reason.trim().length === 0) {
            throw new Error("Escalation reason is required");
        }
        return this.transition(CivicCaseStatus.ESCALATED, { escalationReason: reason });
    }
    resolve() {
        return this.transition(CivicCaseStatus.RESOLVED);
    }
    addElection(electionId) {
        if (this.props.electionIds.includes(electionId)) {
            throw new Error(`Election ${electionId} already registered`);
        }
        return new CivicCase({
            ...this.props,
            electionIds: [...this.props.electionIds, electionId],
            updatedAt: new Date(),
        });
    }
    addFraudIndicator(indicator) {
        return new CivicCase({
            ...this.props,
            fraudIndicators: [...this.props.fraudIndicators, indicator],
            updatedAt: new Date(),
        });
    }
    addTimelineEvent(event) {
        return new CivicCase({
            ...this.props,
            timeline: [...this.props.timeline, event],
            updatedAt: new Date(),
        });
    }
    get id() {
        return this.props.id;
    }
    get name() {
        return this.props.name;
    }
    get status() {
        return this.props.status;
    }
    get electionIds() {
        return this.props.electionIds ?? [];
    }
    get fraudIndicators() {
        return this.props.fraudIndicators ?? [];
    }
    get timeline() {
        return this.props.timeline ?? [];
    }
    get escalationReason() {
        return this.props.escalationReason;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    toJSON() {
        return {
            id: this.props.id,
            name: this.props.name,
            status: this.props.status,
            electionIds: [...(this.props.electionIds ?? [])],
            fraudIndicators: (this.props.fraudIndicators ?? []).map((f) => f.toJSON()),
            timeline: [...(this.props.timeline ?? [])],
            escalationReason: this.props.escalationReason,
            createdAt: this.props.createdAt?.toISOString(),
            updatedAt: this.props.updatedAt?.toISOString(),
        };
    }
}
//# sourceMappingURL=CivicCase.js.map