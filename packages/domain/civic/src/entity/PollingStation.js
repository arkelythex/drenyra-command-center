import { randomUUID } from "node:crypto";
export class PollingStation {
    props;
    constructor(props) {
        this.props = props;
        Object.freeze(this);
    }
    static create(props) {
        if (props.urnCount <= 0) {
            throw new Error("urnCount must be positive");
        }
        if (props.registeredVoters <= 0) {
            throw new Error("registeredVoters must be positive");
        }
        return new PollingStation({
            id: props.id ?? randomUUID(),
            code: props.code,
            name: props.name,
            location: props.location,
            urnCount: props.urnCount,
            registeredVoters: props.registeredVoters,
            electionId: props.electionId,
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        });
    }
    get id() {
        return this.props.id;
    }
    get code() {
        return this.props.code;
    }
    get name() {
        return this.props.name;
    }
    get location() {
        return this.props.location;
    }
    get urnCount() {
        return this.props.urnCount;
    }
    get registeredVoters() {
        return this.props.registeredVoters;
    }
    get electionId() {
        return this.props.electionId;
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
            code: this.props.code,
            name: this.props.name,
            location: this.props.location,
            urnCount: this.props.urnCount,
            registeredVoters: this.props.registeredVoters,
            electionId: this.props.electionId,
            createdAt: this.props.createdAt?.toISOString(),
            updatedAt: this.props.updatedAt?.toISOString(),
        };
    }
}
//# sourceMappingURL=PollingStation.js.map