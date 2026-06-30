import { randomUUID } from "node:crypto";
export var ElectionStatus;
(function (ElectionStatus) {
    ElectionStatus["DRAFT"] = "DRAFT";
    ElectionStatus["ACTIVE"] = "ACTIVE";
    ElectionStatus["COMPLETED"] = "COMPLETED";
    ElectionStatus["AUDITED"] = "AUDITED";
})(ElectionStatus || (ElectionStatus = {}));
const VALID_TRANSITIONS = {
    [ElectionStatus.DRAFT]: [ElectionStatus.ACTIVE],
    [ElectionStatus.ACTIVE]: [ElectionStatus.COMPLETED],
    [ElectionStatus.COMPLETED]: [ElectionStatus.AUDITED],
    [ElectionStatus.AUDITED]: [],
};
export class Election {
    props;
    constructor(props) {
        this.props = props;
        Object.freeze(this);
    }
    static create(props) {
        return new Election({
            id: props.id ?? randomUUID(),
            name: props.name,
            date: props.date,
            region: props.region,
            status: props.status ?? ElectionStatus.DRAFT,
            pollingStationIds: props.pollingStationIds ?? [],
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        });
    }
    transition(newStatus) {
        const allowed = VALID_TRANSITIONS[this.props.status];
        if (!allowed.includes(newStatus)) {
            throw new Error(`Cannot transition election from ${this.props.status} to ${newStatus}`);
        }
        return new Election({
            ...this.props,
            status: newStatus,
            updatedAt: new Date(),
        });
    }
    activate() {
        return this.transition(ElectionStatus.ACTIVE);
    }
    complete() {
        return this.transition(ElectionStatus.COMPLETED);
    }
    audit() {
        return this.transition(ElectionStatus.AUDITED);
    }
    addPollingStation(stationId) {
        if (this.props.pollingStationIds.includes(stationId)) {
            throw new Error(`Polling station ${stationId} already registered`);
        }
        return new Election({
            ...this.props,
            pollingStationIds: [...this.props.pollingStationIds, stationId],
            updatedAt: new Date(),
        });
    }
    get id() {
        return this.props.id;
    }
    get name() {
        return this.props.name;
    }
    get date() {
        return this.props.date;
    }
    get region() {
        return this.props.region;
    }
    get status() {
        return this.props.status;
    }
    get pollingStationIds() {
        return this.props.pollingStationIds ?? [];
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
            date: this.props.date.toISOString(),
            region: this.props.region,
            status: this.props.status,
            pollingStationIds: [...(this.props.pollingStationIds ?? [])],
            createdAt: this.props.createdAt?.toISOString(),
            updatedAt: this.props.updatedAt?.toISOString(),
        };
    }
}
//# sourceMappingURL=Election.js.map