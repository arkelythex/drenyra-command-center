import { Money } from "../value-objects/Money";
export class JournalLine {
    props;
    constructor(props) {
        this.props = props;
        this.validate();
    }
    static create(props) {
        return new JournalLine(props);
    }
    validate() {
        if (!this.props.debit.isZero() && !this.props.credit.isZero()) {
            throw new Error("Una línea no puede tener tanto Debe como Haber");
        }
        if (this.props.debit.isZero() && this.props.credit.isZero()) {
            throw new Error("Una línea debe tener Debe o Haber");
        }
        if (!this.props.description || this.props.description.trim().length === 0) {
            throw new Error("La descripción de la línea es requerida");
        }
    }
    isDebit() {
        return !this.props.debit.isZero();
    }
    isCredit() {
        return !this.props.credit.isZero();
    }
    getAmount() {
        return this.isDebit() ? this.props.debit : this.props.credit;
    }
    get id() {
        return this.props.id;
    }
    get accountId() {
        return this.props.accountId;
    }
    get accountCode() {
        return this.props.accountCode;
    }
    get accountName() {
        return this.props.accountName;
    }
    get description() {
        return this.props.description;
    }
    get debit() {
        return this.props.debit;
    }
    get credit() {
        return this.props.credit;
    }
    get documentType() {
        return this.props.documentType;
    }
    get documentNumber() {
        return this.props.documentNumber;
    }
    get dueDate() {
        return this.props.dueDate;
    }
    toJSON() {
        return {
            id: this.props.id,
            accountId: this.props.accountId,
            accountCode: this.props.accountCode,
            accountName: this.props.accountName,
            description: this.props.description,
            debit: this.props.debit.getAmount(),
            credit: this.props.credit.getAmount(),
            documentType: this.props.documentType,
            documentNumber: this.props.documentNumber,
            dueDate: this.props.dueDate?.toISOString(),
        };
    }
}
export class JournalEntry {
    props;
    constructor(props) {
        this.props = props;
        this.validateBusinessRules();
        Object.freeze(this);
    }
    static create(props) {
        return new JournalEntry(props);
    }
    validateBusinessRules() {
        if (this.props.lines.length < 2) {
            throw new Error("El asiento debe tener al menos 2 líneas (partida doble)");
        }
        if (!this.isBalanced()) {
            const totalDebit = this.getTotalDebit();
            const totalCredit = this.getTotalCredit();
            throw new Error(`El asiento debe estar balanceado. Debe: ${totalDebit.getAmount()}, Haber: ${totalCredit.getAmount()}`);
        }
        if (!this.props.entryNumber || this.props.entryNumber.trim().length === 0) {
            throw new Error("El número de asiento es requerido");
        }
        if (!this.props.gloss || this.props.gloss.trim().length === 0) {
            throw new Error("La glosa es requerida");
        }
        if (this.props.date > new Date()) {
            throw new Error("La fecha del asiento no puede ser futura");
        }
    }
    isBalanced() {
        const totalDebit = this.getTotalDebit();
        const totalCredit = this.getTotalCredit();
        return totalDebit.equals(totalCredit);
    }
    getTotalDebit() {
        return this.props.lines.reduce((acc, line) => acc.add(line.debit), Money.zero("PEN"));
    }
    getTotalCredit() {
        return this.props.lines.reduce((acc, line) => acc.add(line.credit), Money.zero("PEN"));
    }
    canBeModified() {
        return this.props.status === "borrador";
    }
    canBeDeleted() {
        return this.props.status === "borrador";
    }
    canBePosted() {
        return this.props.status === "borrador" && this.isBalanced();
    }
    canBeDeclared() {
        return this.props.status === "mayorizado";
    }
    markAsPosted(userId) {
        if (!this.canBePosted()) {
            throw new Error("Solo se pueden mayorizar asientos en borrador y balanceados");
        }
        return new JournalEntry({
            ...this.props,
            status: "mayorizado",
            postedBy: userId,
            postedAt: new Date(),
            updatedAt: new Date(),
        });
    }
    markAsDeclared() {
        if (!this.canBeDeclared()) {
            throw new Error("Solo se pueden declarar asientos mayorizados");
        }
        return new JournalEntry({
            ...this.props,
            status: "declarado",
            updatedAt: new Date(),
        });
    }
    update(data) {
        if (!this.canBeModified()) {
            throw new Error("Solo se pueden editar asientos en borrador");
        }
        return new JournalEntry({
            ...this.props,
            date: data.date ?? this.props.date,
            gloss: data.gloss ?? this.props.gloss,
            lines: data.lines ?? this.props.lines,
            updatedAt: new Date(),
        });
    }
    equals(other) {
        if (!other)
            return false;
        return this.props.id === other.props.id;
    }
    get id() {
        return this.props.id;
    }
    get organizationId() {
        return this.props.organizationId;
    }
    get entryNumber() {
        return this.props.entryNumber;
    }
    get date() {
        return this.props.date;
    }
    get gloss() {
        return this.props.gloss;
    }
    get status() {
        return this.props.status;
    }
    get lines() {
        return this.props.lines;
    }
    get postedBy() {
        return this.props.postedBy;
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
            organizationId: this.props.organizationId,
            entryNumber: this.props.entryNumber,
            date: this.props.date.toISOString(),
            gloss: this.props.gloss,
            status: this.props.status,
            totalDebit: this.getTotalDebit().getAmount(),
            totalCredit: this.getTotalCredit().getAmount(),
            lines: this.props.lines.map((line) => line.toJSON()),
            postedBy: this.props.postedBy,
            postedAt: this.props.postedAt?.toISOString(),
            createdAt: this.props.createdAt.toISOString(),
            updatedAt: this.props.updatedAt.toISOString(),
        };
    }
}
//# sourceMappingURL=JournalEntry.js.map