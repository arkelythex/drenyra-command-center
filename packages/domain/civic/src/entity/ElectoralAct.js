import { randomUUID } from "node:crypto";
export var ValidationStatus;
(function (ValidationStatus) {
    ValidationStatus["PENDING"] = "PENDING";
    ValidationStatus["VALID"] = "VALID";
    ValidationStatus["INVALID"] = "INVALID";
})(ValidationStatus || (ValidationStatus = {}));
export class ElectoralAct {
    props;
    constructor(props) {
        this.props = props;
        Object.freeze(this);
    }
    static create(props) {
        if (!props.voteTallies || props.voteTallies.size === 0) {
            throw new Error("voteTallies must not be empty");
        }
        return new ElectoralAct({
            id: props.id ?? randomUUID(),
            stationId: props.stationId,
            urnNumber: props.urnNumber,
            voteTallies: new Map(props.voteTallies),
            validationStatus: props.validationStatus ?? ValidationStatus.PENDING,
            validatedAt: props.validatedAt,
            validatedBy: props.validatedBy,
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        });
    }
    mark(status, validatedBy) {
        if (this.props.validationStatus !== ValidationStatus.PENDING) {
            throw new Error(`Cannot validate an act with status ${this.props.validationStatus}`);
        }
        return new ElectoralAct({
            ...this.props,
            validationStatus: status,
            validatedAt: new Date(),
            validatedBy,
            updatedAt: new Date(),
        });
    }
    markValid(validatedBy) {
        return this.mark(ValidationStatus.VALID, validatedBy);
    }
    markInvalid(validatedBy) {
        return this.mark(ValidationStatus.INVALID, validatedBy);
    }
    get id() {
        return this.props.id;
    }
    get stationId() {
        return this.props.stationId;
    }
    get urnNumber() {
        return this.props.urnNumber;
    }
    get voteTallies() {
        return new Map(this.props.voteTallies);
    }
    get validationStatus() {
        return this.props.validationStatus;
    }
    get validatedAt() {
        return this.props.validatedAt;
    }
    get validatedBy() {
        return this.props.validatedBy;
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
            stationId: this.props.stationId,
            urnNumber: this.props.urnNumber,
            voteTallies: Object.fromEntries(this.props.voteTallies),
            validationStatus: this.props.validationStatus,
            validatedAt: this.props.validatedAt?.toISOString(),
            validatedBy: this.props.validatedBy,
            createdAt: this.props.createdAt?.toISOString(),
            updatedAt: this.props.updatedAt?.toISOString(),
        };
    }
}
//# sourceMappingURL=ElectoralAct.js.map