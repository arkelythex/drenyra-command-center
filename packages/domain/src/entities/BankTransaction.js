export class BankTransaction {
    props;
    constructor(props) {
        this.props = props;
        this.validateBusinessRules();
    }
    static create(props) {
        return new BankTransaction(props);
    }
    static createNew(params) {
        const now = new Date();
        return new BankTransaction({
            id: 0,
            bankAccountId: params.bankAccountId,
            transactionDate: params.transactionDate,
            description: params.description,
            reference: params.reference,
            type: params.type,
            amount: params.amount,
            balanceAfter: params.balanceAfter,
            source: params.source ?? "MANUAL",
            externalId: params.externalId ?? null,
            reconciliationBatchId: null,
            isReconciled: false,
            importBatch: params.importBatch,
            createdAt: now,
            updatedAt: now,
        });
    }
    validateBusinessRules() {
        if (!this.props.bankAccountId) {
            throw new Error("La cuenta bancaria es requerida");
        }
        if (!this.props.transactionDate) {
            throw new Error("La fecha de transacción es requerida");
        }
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (this.props.transactionDate > today) {
            throw new Error("La fecha de transacción no puede ser futura");
        }
        if (!this.props.description || this.props.description.trim() === "") {
            throw new Error("La descripción es requerida");
        }
        if (this.props.amount.isZero()) {
            throw new Error("El monto no puede ser cero");
        }
    }
    reconcile(reconciliationId, journalEntryId) {
        if (this.props.isReconciled) {
            throw new Error("La transacción ya está conciliada");
        }
        return new BankTransaction({
            ...this.props,
            isReconciled: true,
            reconciledAt: new Date(),
            reconciliationId,
            journalEntryId,
            updatedAt: new Date(),
        });
    }
    unreconcile() {
        if (!this.props.isReconciled) {
            throw new Error("La transacción no está conciliada");
        }
        return new BankTransaction({
            ...this.props,
            isReconciled: false,
            reconciledAt: undefined,
            reconciliationId: undefined,
            journalEntryId: undefined,
            updatedAt: new Date(),
        });
    }
    assignToBatch(batchId) {
        return new BankTransaction({
            ...this.props,
            reconciliationBatchId: batchId,
            updatedAt: new Date(),
        });
    }
    markReconciled(reconciliationId) {
        if (this.props.isReconciled) {
            return this;
        }
        return new BankTransaction({
            ...this.props,
            isReconciled: true,
            reconciledAt: new Date(),
            reconciliationId: reconciliationId ?? this.props.reconciliationId,
            updatedAt: new Date(),
        });
    }
    isInflow() {
        return ["DEPOSIT", "TRANSFER_IN", "INTEREST"].includes(this.props.type);
    }
    isOutflow() {
        return ["WITHDRAWAL", "TRANSFER_OUT", "FEE", "CHECK"].includes(this.props.type);
    }
    getSignedAmount() {
        const amount = this.props.amount.getAmount();
        return this.isInflow() ? amount : -amount;
    }
    canBeModified() {
        return !this.props.isReconciled;
    }
    equals(other) {
        if (!other)
            return false;
        return this.props.id === other.props.id;
    }
    get id() {
        return this.props.id;
    }
    get bankAccountId() {
        return this.props.bankAccountId;
    }
    get transactionDate() {
        return this.props.transactionDate;
    }
    get description() {
        return this.props.description;
    }
    get reference() {
        return this.props.reference;
    }
    get type() {
        return this.props.type;
    }
    get amount() {
        return this.props.amount;
    }
    get balanceAfter() {
        return this.props.balanceAfter;
    }
    get isReconciled() {
        return this.props.isReconciled;
    }
    get reconciledAt() {
        return this.props.reconciledAt;
    }
    get reconciliationId() {
        return this.props.reconciliationId;
    }
    get journalEntryId() {
        return this.props.journalEntryId;
    }
    get source() {
        return this.props.source ?? "MANUAL";
    }
    get externalId() {
        return this.props.externalId ?? null;
    }
    get reconciliationBatchId() {
        return this.props.reconciliationBatchId ?? null;
    }
    get importBatch() {
        return this.props.importBatch;
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
            bankAccountId: this.props.bankAccountId,
            transactionDate: this.props.transactionDate.toISOString(),
            description: this.props.description,
            reference: this.props.reference,
            type: this.props.type,
            amount: this.props.amount.toJSON(),
            balanceAfter: this.props.balanceAfter?.toJSON(),
            source: this.props.source ?? "MANUAL",
            externalId: this.props.externalId ?? null,
            reconciliationBatchId: this.props.reconciliationBatchId ?? null,
            isReconciled: this.props.isReconciled,
            reconciledAt: this.props.reconciledAt?.toISOString(),
            reconciliationId: this.props.reconciliationId,
            journalEntryId: this.props.journalEntryId,
            importBatch: this.props.importBatch,
            createdAt: this.props.createdAt.toISOString(),
            updatedAt: this.props.updatedAt.toISOString(),
        };
    }
}
//# sourceMappingURL=BankTransaction.js.map