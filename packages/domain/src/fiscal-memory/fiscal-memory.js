import { FISCAL_MEMORY_CATEGORIES, FISCAL_MEMORY_ERROR_CODES, FISCAL_MEMORY_EVIDENCE_REQUIRED_CATEGORIES, FISCAL_MEMORY_SEVERITIES, FISCAL_MEMORY_STATUSES, } from "./fiscal-memory.types";
export class InvalidFiscalMemoryError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = "InvalidFiscalMemoryError";
        Object.setPrototypeOf(this, InvalidFiscalMemoryError.prototype);
    }
}
const PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const RUC_PATTERN = /^\d{11}$/;
const assertNonEmpty = (value, code, field) => {
    if (value.trim().length === 0) {
        throw new InvalidFiscalMemoryError(code, `${field} is required`);
    }
};
const normalizeList = (values) => {
    return Object.freeze([...(values ?? [])].map((value) => value.trim()).filter(Boolean));
};
export class FiscalMemory {
    props;
    constructor(props) {
        this.props = props;
        Object.freeze(this.props.evidenceRefs);
        Object.freeze(this.props.tags);
        Object.freeze(this.props.relatedMemoryIds ?? []);
        Object.freeze(this.props);
        Object.freeze(this);
    }
    static create(input) {
        const now = new Date();
        const props = {
            ...input,
            status: input.status ?? "active",
            evidenceRefs: normalizeList(input.evidenceRefs),
            tags: normalizeList(input.tags),
            relatedMemoryIds: normalizeList(input.relatedMemoryIds),
            createdAt: input.createdAt ?? now,
            updatedAt: input.updatedAt ?? now,
        };
        FiscalMemory.validate(props);
        return new FiscalMemory(props);
    }
    static rehydrate(props) {
        FiscalMemory.validate(props);
        return new FiscalMemory({
            ...props,
            evidenceRefs: normalizeList(props.evidenceRefs),
            tags: normalizeList(props.tags),
            relatedMemoryIds: normalizeList(props.relatedMemoryIds),
        });
    }
    static validate(props) {
        assertNonEmpty(props.id, FISCAL_MEMORY_ERROR_CODES.INVALID_SCOPE, "id");
        assertNonEmpty(props.tenantId, FISCAL_MEMORY_ERROR_CODES.INVALID_SCOPE, "tenantId");
        assertNonEmpty(props.companyId, FISCAL_MEMORY_ERROR_CODES.INVALID_SCOPE, "companyId");
        assertNonEmpty(props.createdBy, FISCAL_MEMORY_ERROR_CODES.INVALID_SCOPE, "createdBy");
        if (!RUC_PATTERN.test(props.ruc)) {
            throw new InvalidFiscalMemoryError(FISCAL_MEMORY_ERROR_CODES.INVALID_RUC, "ruc must be an 11-digit SUNAT RUC");
        }
        if (!PERIOD_PATTERN.test(props.period)) {
            throw new InvalidFiscalMemoryError(FISCAL_MEMORY_ERROR_CODES.INVALID_PERIOD, "period must use YYYY-MM format");
        }
        if (!FISCAL_MEMORY_CATEGORIES.includes(props.category)) {
            throw new InvalidFiscalMemoryError(FISCAL_MEMORY_ERROR_CODES.INVALID_CATEGORY, `Unsupported fiscal memory category: ${props.category}`);
        }
        if (!FISCAL_MEMORY_SEVERITIES.includes(props.severity)) {
            throw new InvalidFiscalMemoryError(FISCAL_MEMORY_ERROR_CODES.INVALID_SEVERITY, `Unsupported fiscal memory severity: ${props.severity}`);
        }
        if (!FISCAL_MEMORY_STATUSES.includes(props.status)) {
            throw new InvalidFiscalMemoryError(FISCAL_MEMORY_ERROR_CODES.INVALID_STATUS, `Unsupported fiscal memory status: ${props.status}`);
        }
        assertNonEmpty(props.title, FISCAL_MEMORY_ERROR_CODES.EMPTY_TITLE, "title");
        assertNonEmpty(props.summary, FISCAL_MEMORY_ERROR_CODES.EMPTY_SUMMARY, "summary");
        if (FISCAL_MEMORY_EVIDENCE_REQUIRED_CATEGORIES.has(props.category) &&
            props.evidenceRefs.length === 0) {
            throw new InvalidFiscalMemoryError(FISCAL_MEMORY_ERROR_CODES.EVIDENCE_REQUIRED, `${props.category} requires evidenceRefs`);
        }
    }
    withStatus(status, updatedAt = new Date()) {
        return FiscalMemory.rehydrate({ ...this.props, status, updatedAt });
    }
    withSummary(summary, updatedAt = new Date()) {
        return FiscalMemory.rehydrate({ ...this.props, summary, updatedAt });
    }
    get id() {
        return this.props.id;
    }
    get tenantId() {
        return this.props.tenantId;
    }
    get companyId() {
        return this.props.companyId;
    }
    get ruc() {
        return this.props.ruc;
    }
    get period() {
        return this.props.period;
    }
    get category() {
        return this.props.category;
    }
    get severity() {
        return this.props.severity;
    }
    get status() {
        return this.props.status;
    }
    get title() {
        return this.props.title;
    }
    get summary() {
        return this.props.summary;
    }
    get evidenceRefs() {
        return this.props.evidenceRefs;
    }
    get tags() {
        return this.props.tags;
    }
    get createdBy() {
        return this.props.createdBy;
    }
    get approvedBy() {
        return this.props.approvedBy;
    }
    get sourceAgentId() {
        return this.props.sourceAgentId;
    }
    get relatedMemoryIds() {
        return this.props.relatedMemoryIds ?? [];
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    toJSON() {
        return {
            ...this.props,
            evidenceRefs: [...this.props.evidenceRefs],
            tags: [...this.props.tags],
            relatedMemoryIds: [...(this.props.relatedMemoryIds ?? [])],
        };
    }
}
//# sourceMappingURL=fiscal-memory.js.map