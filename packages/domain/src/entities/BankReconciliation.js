export class BankReconciliation {
    props;
    constructor(props) {
        this.props = props;
        this.validateBusinessRules();
    }
    static create(props) {
        return new BankReconciliation(props);
    }
    static createNew(params) {
        const now = new Date();
        return new BankReconciliation({
            id: 0,
            bankAccountId: params.bankAccountId,
            organizationId: params.organizationId,
            periodStart: params.periodStart,
            periodEnd: params.periodEnd,
            openingBalance: params.openingBalance,
            closingBalanceStatement: params.closingBalanceStatement,
            closingBalanceBooks: 0,
            difference: 0,
            status: "DRAFT",
            reconciledTransactionIds: [],
            createdAt: now,
            updatedAt: now,
        });
    }
    validateBusinessRules() {
        if (this.props.periodEnd < this.props.periodStart) {
            throw new Error("La fecha de fin debe ser posterior a la fecha de inicio");
        }
    }
    addTransaction(transactionId) {
        if (this.props.status !== "DRAFT") {
            throw new Error("Solo se pueden agregar transacciones a conciliaciones en borrador");
        }
        if (this.props.reconciledTransactionIds.includes(transactionId)) {
            return this;
        }
        return new BankReconciliation({
            ...this.props,
            reconciledTransactionIds: [
                ...this.props.reconciledTransactionIds,
                transactionId,
            ],
            updatedAt: new Date(),
        });
    }
    removeTransaction(transactionId) {
        if (this.props.status !== "DRAFT") {
            throw new Error("Solo se pueden remover transacciones de conciliaciones en borrador");
        }
        return new BankReconciliation({
            ...this.props,
            reconciledTransactionIds: this.props.reconciledTransactionIds.filter((id) => id !== transactionId),
            updatedAt: new Date(),
        });
    }
    updateBooksBalance(closingBalanceBooks) {
        if (this.props.status !== "DRAFT") {
            throw new Error("Solo se pueden actualizar conciliaciones en borrador");
        }
        const difference = Math.round((this.props.closingBalanceStatement - closingBalanceBooks) * 100) / 100;
        return new BankReconciliation({
            ...this.props,
            closingBalanceBooks,
            difference,
            updatedAt: new Date(),
        });
    }
    complete(userId) {
        if (this.props.status !== "DRAFT") {
            throw new Error("La conciliación ya fue completada o cancelada");
        }
        if (Math.abs(this.props.difference) > 0.01 && !this.props.notes) {
            throw new Error("Debe explicar la diferencia en las notas antes de completar");
        }
        return new BankReconciliation({
            ...this.props,
            status: "COMPLETED",
            reconciledByUserId: userId,
            completedAt: new Date(),
            updatedAt: new Date(),
        });
    }
    cancel() {
        if (this.props.status === "CANCELLED") {
            throw new Error("La conciliación ya está cancelada");
        }
        return new BankReconciliation({
            ...this.props,
            status: "CANCELLED",
            updatedAt: new Date(),
        });
    }
    addNotes(notes) {
        return new BankReconciliation({
            ...this.props,
            notes: this.props.notes ? `${this.props.notes}\n${notes}` : notes,
            updatedAt: new Date(),
        });
    }
    isBalanced() {
        return Math.abs(this.props.difference) < 0.01;
    }
    get id() {
        return this.props.id;
    }
    get bankAccountId() {
        return this.props.bankAccountId;
    }
    get organizationId() {
        return this.props.organizationId;
    }
    get periodStart() {
        return this.props.periodStart;
    }
    get periodEnd() {
        return this.props.periodEnd;
    }
    get openingBalance() {
        return this.props.openingBalance;
    }
    get closingBalanceStatement() {
        return this.props.closingBalanceStatement;
    }
    get closingBalanceBooks() {
        return this.props.closingBalanceBooks;
    }
    get difference() {
        return this.props.difference;
    }
    get status() {
        return this.props.status;
    }
    get reconciledTransactionIds() {
        return [...this.props.reconciledTransactionIds];
    }
    get reconciledByUserId() {
        return this.props.reconciledByUserId;
    }
    get notes() {
        return this.props.notes;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    get completedAt() {
        return this.props.completedAt;
    }
    toJSON() {
        return {
            id: this.props.id,
            bankAccountId: this.props.bankAccountId,
            organizationId: this.props.organizationId,
            periodStart: this.props.periodStart.toISOString(),
            periodEnd: this.props.periodEnd.toISOString(),
            openingBalance: this.props.openingBalance,
            closingBalanceStatement: this.props.closingBalanceStatement,
            closingBalanceBooks: this.props.closingBalanceBooks,
            difference: this.props.difference,
            status: this.props.status,
            reconciledTransactionIds: this.props.reconciledTransactionIds,
            reconciledByUserId: this.props.reconciledByUserId,
            notes: this.props.notes,
            createdAt: this.props.createdAt.toISOString(),
            updatedAt: this.props.updatedAt.toISOString(),
            completedAt: this.props.completedAt?.toISOString(),
        };
    }
}
//# sourceMappingURL=BankReconciliation.js.map