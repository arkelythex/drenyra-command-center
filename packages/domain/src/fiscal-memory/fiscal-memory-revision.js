import { InvalidFiscalMemoryError } from "./fiscal-memory";
import { FISCAL_MEMORY_ERROR_CODES } from "./fiscal-memory.types";
const assertText = (value, field) => {
    if (value.trim().length === 0) {
        throw new InvalidFiscalMemoryError(FISCAL_MEMORY_ERROR_CODES.INVALID_SCOPE, `${field} is required`);
    }
};
export class FiscalMemoryRevision {
    props;
    constructor(props) {
        this.props = props;
        Object.freeze(this.props);
        Object.freeze(this);
    }
    static create(props) {
        assertText(props.id, "id");
        assertText(props.memoryId, "memoryId");
        assertText(props.changedBy, "changedBy");
        assertText(props.changeReason, "changeReason");
        if (!Number.isInteger(props.revisionNumber) || props.revisionNumber <= 0) {
            throw new InvalidFiscalMemoryError(FISCAL_MEMORY_ERROR_CODES.INVALID_STATUS, "revisionNumber must be a positive integer");
        }
        return new FiscalMemoryRevision(props);
    }
    get id() {
        return this.props.id;
    }
    get memoryId() {
        return this.props.memoryId;
    }
    get revisionNumber() {
        return this.props.revisionNumber;
    }
    get changedBy() {
        return this.props.changedBy;
    }
    get changeReason() {
        return this.props.changeReason;
    }
    get previousValue() {
        return this.props.previousValue;
    }
    get nextValue() {
        return this.props.nextValue;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    toJSON() {
        return { ...this.props };
    }
}
//# sourceMappingURL=fiscal-memory-revision.js.map