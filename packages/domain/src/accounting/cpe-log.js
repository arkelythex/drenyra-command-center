export class CPELog {
    _id;
    _invoiceId;
    _sunatStatus;
    _submittedAt;
    _acceptedAt;
    _rejectedAt;
    _observedAt;
    _cancelledAt;
    _sunatTicket;
    _cdr;
    _hashValue;
    _hashAlgorithm;
    _errorMessage;
    _errorCode;
    _createdAt;
    constructor(_id, _invoiceId, _sunatStatus, _submittedAt, _acceptedAt, _rejectedAt, _observedAt, _cancelledAt, _sunatTicket, _cdr, _hashValue, _hashAlgorithm, _errorMessage, _errorCode, _createdAt) {
        this._id = _id;
        this._invoiceId = _invoiceId;
        this._sunatStatus = _sunatStatus;
        this._submittedAt = _submittedAt;
        this._acceptedAt = _acceptedAt;
        this._rejectedAt = _rejectedAt;
        this._observedAt = _observedAt;
        this._cancelledAt = _cancelledAt;
        this._sunatTicket = _sunatTicket;
        this._cdr = _cdr;
        this._hashValue = _hashValue;
        this._hashAlgorithm = _hashAlgorithm;
        this._errorMessage = _errorMessage;
        this._errorCode = _errorCode;
        this._createdAt = _createdAt;
        Object.freeze(this);
    }
    static create(id, invoiceId) {
        if (!id || id.trim().length === 0) {
            throw new InvalidCPELogError("id", "CPE log ID is required");
        }
        if (!invoiceId || invoiceId.trim().length === 0) {
            throw new InvalidCPELogError("invoiceId", "Invoice ID is required");
        }
        return new CPELog(id.trim(), invoiceId.trim(), "pendiente", null, null, null, null, null, null, null, null, null, null, null, new Date());
    }
    get id() {
        return this._id;
    }
    get invoiceId() {
        return this._invoiceId;
    }
    get sunatStatus() {
        return this._sunatStatus;
    }
    get submittedAt() {
        return this._submittedAt ? new Date(this._submittedAt.getTime()) : null;
    }
    get acceptedAt() {
        return this._acceptedAt ? new Date(this._acceptedAt.getTime()) : null;
    }
    get rejectedAt() {
        return this._rejectedAt ? new Date(this._rejectedAt.getTime()) : null;
    }
    get observedAt() {
        return this._observedAt ? new Date(this._observedAt.getTime()) : null;
    }
    get cancelledAt() {
        return this._cancelledAt ? new Date(this._cancelledAt.getTime()) : null;
    }
    get sunatTicket() {
        return this._sunatTicket;
    }
    get cdr() {
        return this._cdr;
    }
    get hashValue() {
        return this._hashValue;
    }
    get hashAlgorithm() {
        return this._hashAlgorithm;
    }
    get errorMessage() {
        return this._errorMessage;
    }
    get errorCode() {
        return this._errorCode;
    }
    get createdAt() {
        return new Date(this._createdAt.getTime());
    }
    isSubmitted() {
        return this._sunatStatus !== "pendiente";
    }
    isAccepted() {
        return this._sunatStatus === "aceptado";
    }
    isRejected() {
        return this._sunatStatus === "rechazado";
    }
    isObserved() {
        return this._sunatStatus === "observado";
    }
    isCancelled() {
        return this._sunatStatus === "baja";
    }
    isTerminal() {
        return (this._sunatStatus === "aceptado" ||
            this._sunatStatus === "rechazado" ||
            this._sunatStatus === "baja");
    }
    submit(sunatTicket, hashValue, hashAlgorithm = "SHA-256") {
        if (this._sunatStatus !== "pendiente") {
            throw new InvalidCPELogTransitionError(this._sunatStatus, "enviado", "Only pending CPEs can be submitted");
        }
        if (!sunatTicket || sunatTicket.trim().length === 0) {
            throw new InvalidCPELogError("sunatTicket", "SUNAT ticket is required for submission");
        }
        if (!hashValue || hashValue.trim().length === 0) {
            throw new InvalidCPELogError("hashValue", "Hash value is required for submission");
        }
        return new CPELog(this._id, this._invoiceId, "enviado", new Date(), null, null, null, null, sunatTicket.trim(), null, hashValue.trim(), hashAlgorithm, null, null, this._createdAt);
    }
    accept(cdr) {
        if (this._sunatStatus !== "enviado" && this._sunatStatus !== "observado") {
            throw new InvalidCPELogTransitionError(this._sunatStatus, "aceptado", "Only submitted or observed CPEs can be accepted");
        }
        if (!cdr.id || cdr.id.trim().length === 0) {
            throw new InvalidCPELogError("cdr.id", "CDR ID is required");
        }
        return new CPELog(this._id, this._invoiceId, "aceptado", this._submittedAt, new Date(), null, null, null, this._sunatTicket, cdr, this._hashValue, this._hashAlgorithm, null, null, this._createdAt);
    }
    reject(reason, errorCode) {
        if (this._sunatStatus !== "enviado") {
            throw new InvalidCPELogTransitionError(this._sunatStatus, "rechazado", "Only submitted CPEs can be rejected");
        }
        if (!reason || reason.trim().length === 0) {
            throw new InvalidCPELogError("reason", "Rejection reason is required");
        }
        return new CPELog(this._id, this._invoiceId, "rechazado", this._submittedAt, null, new Date(), null, null, this._sunatTicket, null, this._hashValue, this._hashAlgorithm, reason.trim(), errorCode?.trim() ?? null, this._createdAt);
    }
    observe(observation) {
        if (this._sunatStatus !== "enviado") {
            throw new InvalidCPELogTransitionError(this._sunatStatus, "observado", "Only submitted CPEs can be observed");
        }
        if (!observation || observation.trim().length === 0) {
            throw new InvalidCPELogError("observation", "Observation description is required");
        }
        return new CPELog(this._id, this._invoiceId, "observado", this._submittedAt, null, null, new Date(), null, this._sunatTicket, null, this._hashValue, this._hashAlgorithm, observation.trim(), null, this._createdAt);
    }
    cancel(reason) {
        if (this.isTerminal()) {
            throw new InvalidCPELogTransitionError(this._sunatStatus, "baja", "Cannot cancel a CPE in terminal state");
        }
        if (!reason || reason.trim().length === 0) {
            throw new InvalidCPELogError("reason", "Cancellation reason is required");
        }
        return new CPELog(this._id, this._invoiceId, "baja", this._submittedAt, null, null, null, new Date(), this._sunatTicket, this._cdr, this._hashValue, this._hashAlgorithm, reason.trim(), this._errorCode, this._createdAt);
    }
    equals(other) {
        if (!other)
            return false;
        return (this._id === other._id &&
            this._invoiceId === other._invoiceId &&
            this._sunatStatus === other._sunatStatus &&
            this._sunatTicket === other._sunatTicket);
    }
    toString() {
        return `CPELog(${this._id}, ${this._invoiceId}, ${this._sunatStatus})`;
    }
    toJSON() {
        return {
            id: this._id,
            invoiceId: this._invoiceId,
            sunatStatus: this._sunatStatus,
            submittedAt: this._submittedAt?.toISOString() ?? null,
            acceptedAt: this._acceptedAt?.toISOString() ?? null,
            rejectedAt: this._rejectedAt?.toISOString() ?? null,
            observedAt: this._observedAt?.toISOString() ?? null,
            cancelledAt: this._cancelledAt?.toISOString() ?? null,
            sunatTicket: this._sunatTicket,
            cdr: this._cdr
                ? {
                    ...this._cdr,
                    receivedAt: this._cdr.receivedAt.toISOString(),
                }
                : null,
            hashValue: this._hashValue,
            hashAlgorithm: this._hashAlgorithm,
            errorMessage: this._errorMessage,
            errorCode: this._errorCode,
            createdAt: this._createdAt.toISOString(),
        };
    }
    static fromJSON(json) {
        return CPELog.create(json.id, json.invoiceId);
    }
}
export class InvalidCPELogError extends Error {
    field;
    constructor(field, message) {
        super(message || `Invalid CPE log field: ${field}`);
        this.field = field;
        this.name = "InvalidCPELogError";
        Object.setPrototypeOf(this, InvalidCPELogError.prototype);
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            field: this.field,
            code: "INVALID_CPE_LOG",
        };
    }
}
export class InvalidCPELogTransitionError extends Error {
    currentStatus;
    targetStatus;
    constructor(currentStatus, targetStatus, message) {
        super(message ||
            `Invalid CPE log transition: ${currentStatus} → ${targetStatus}`);
        this.currentStatus = currentStatus;
        this.targetStatus = targetStatus;
        this.name = "InvalidCPELogTransitionError";
        Object.setPrototypeOf(this, InvalidCPELogTransitionError.prototype);
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            currentStatus: this.currentStatus,
            targetStatus: this.targetStatus,
            code: "INVALID_CPE_LOG_TRANSITION",
        };
    }
}
//# sourceMappingURL=cpe-log.js.map