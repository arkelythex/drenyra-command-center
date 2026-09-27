import { Money } from "../value-objects/Money";
export class Transaction {
    props;
    constructor(props) {
        this.props = props;
        this.validateBusinessRules();
        Object.freeze(this);
    }
    static create(props) {
        return new Transaction(props);
    }
    validateBusinessRules() {
        if (this.props.entries.length < 2) {
            throw new Error("Una transacción debe tener al menos 2 asientos (partida doble)");
        }
        if (this.props.date > new Date()) {
            throw new Error("La fecha de la transacción no puede ser futura");
        }
        for (const entry of this.props.entries) {
            const hasDebit = entry.debit.isPositive();
            const hasCredit = entry.credit.isPositive();
            if (hasDebit && hasCredit) {
                throw new Error(`El asiento ${entry.id} no puede tener débito y crédito simultáneamente`);
            }
            if (!hasDebit && !hasCredit) {
                throw new Error(`El asiento ${entry.id} debe tener débito o crédito`);
            }
        }
        if (this.props.entries.length > 0) {
            const firstCurrency = this.props.entries[0]?.debit.getCurrency() ??
                this.props.entries[0]?.credit.getCurrency();
            for (const entry of this.props.entries) {
                if (entry.debit.getCurrency() !== firstCurrency ||
                    entry.credit.getCurrency() !== firstCurrency) {
                    throw new Error("Todos los asientos deben usar la misma moneda");
                }
            }
        }
        const totalDebits = this.calculateTotalDebits();
        const totalCredits = this.calculateTotalCredits();
        if (!totalDebits.equals(totalCredits)) {
            throw new Error(`Los débitos (${totalDebits.getAmount()}) deben ser iguales a los créditos (${totalCredits.getAmount()})`);
        }
    }
    calculateTotalDebits() {
        if (this.props.entries.length === 0) {
            return Money.zero("PEN");
        }
        return this.props.entries.reduce((acc, entry) => acc.add(entry.debit), Money.zero(this.props.entries[0]?.debit.getCurrency() ?? "PEN"));
    }
    calculateTotalCredits() {
        if (this.props.entries.length === 0) {
            return Money.zero("PEN");
        }
        return this.props.entries.reduce((acc, entry) => acc.add(entry.credit), Money.zero(this.props.entries[0]?.credit.getCurrency() ?? "PEN"));
    }
    post(postedBy) {
        if (this.props.status !== "DRAFT") {
            throw new Error("Solo se pueden contabilizar transacciones en borrador");
        }
        return new Transaction({
            ...this.props,
            status: "POSTED",
            postedAt: new Date(),
            postedBy,
            updatedAt: new Date(),
        });
    }
    void(voidedBy, reason) {
        if (this.props.status !== "POSTED") {
            throw new Error("Solo se pueden anular transacciones contabilizadas");
        }
        return new Transaction({
            ...this.props,
            status: "VOIDED",
            voidedAt: new Date(),
            voidedBy,
            voidReason: reason,
            updatedAt: new Date(),
        });
    }
    canBeModified() {
        return this.props.status === "DRAFT";
    }
    isBalanced() {
        const totalDebits = this.calculateTotalDebits();
        const totalCredits = this.calculateTotalCredits();
        return totalDebits.equals(totalCredits);
    }
    getTotalAmount() {
        return this.calculateTotalDebits();
    }
    equals(other) {
        if (!other) {
            return false;
        }
        return this.props.id === other.props.id;
    }
    get id() {
        return this.props.id;
    }
    get type() {
        return this.props.type;
    }
    get date() {
        return this.props.date;
    }
    get description() {
        return this.props.description;
    }
    get referenceNumber() {
        return this.props.referenceNumber;
    }
    get entries() {
        return this.props.entries;
    }
    get status() {
        return this.props.status;
    }
    get postedAt() {
        return this.props.postedAt;
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
            type: this.props.type,
            date: this.props.date.toISOString(),
            description: this.props.description,
            referenceNumber: this.props.referenceNumber,
            entries: this.props.entries.map((entry) => ({
                ...entry,
                debit: entry.debit.toJSON(),
                credit: entry.credit.toJSON(),
            })),
            status: this.props.status,
            postedAt: this.props.postedAt?.toISOString(),
            postedBy: this.props.postedBy,
            voidedAt: this.props.voidedAt?.toISOString(),
            voidedBy: this.props.voidedBy,
            voidReason: this.props.voidReason,
            createdAt: this.props.createdAt.toISOString(),
            updatedAt: this.props.updatedAt.toISOString(),
        };
    }
}
//# sourceMappingURL=Transaction.js.map