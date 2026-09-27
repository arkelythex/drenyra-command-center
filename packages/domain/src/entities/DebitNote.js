import { DocumentSeries } from "../value-objects/DocumentSeries";
import { Money } from "../value-objects/Money";
export class DebitNote {
    props;
    constructor(props) {
        this.props = props;
        this.validateBusinessRules();
        Object.freeze(this);
    }
    static create(props) {
        return new DebitNote(props);
    }
    static fromPrimitives(data) {
        const currency = data.currency;
        const props = {
            id: data.id,
            referenceInvoiceId: data.referenceInvoiceId,
            additionalAmount: Money.fromCents(data.additionalAmount, currency),
            totalAmount: Money.fromCents(data.totalAmount, currency),
            baseAmount: Money.fromCents(data.baseAmount, currency),
            igvAmount: Money.fromCents(data.igvAmount, currency),
            currency,
            reason: data.reason,
            series: DocumentSeries.create(data.series),
            number: data.number,
            status: data.status,
            sunatResponseCode: data.sunatResponseCode,
            sentToSunatAt: data.sentToSunatAt
                ? new Date(data.sentToSunatAt)
                : undefined,
            issueDate: new Date(data.issueDate),
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        };
        return new DebitNote(props);
    }
    validateBusinessRules() {
        if (!this.props.series.isDebitNote()) {
            throw new Error(`Serie inválida para nota de débito: ${this.props.series.toString()}. Debe ser FD01 o BD01.`);
        }
        const expectedTotal = this.props.baseAmount.add(this.props.igvAmount);
        if (!this.props.totalAmount.equals(expectedTotal)) {
            throw new Error(`El total (${this.props.totalAmount.getAmount()}) debe ser igual a base + IGV (${expectedTotal.getAmount()})`);
        }
        if (!this.props.baseAmount.isPositive()) {
            throw new Error("El monto adicional de la nota de débito debe ser positivo");
        }
        if (this.props.issueDate > new Date()) {
            throw new Error("La fecha de emisión no puede ser futura");
        }
        if (this.props.number <= 0) {
            throw new Error("El número de nota de débito debe ser positivo");
        }
        if (!this.props.reason || this.props.reason.trim().length === 0) {
            throw new Error("La nota de débito debe tener una razón");
        }
    }
    markAsSent(sunatResponseCode) {
        if (this.props.status !== "DRAFT") {
            throw new Error("Solo se pueden enviar notas de débito en estado DRAFT");
        }
        return new DebitNote({
            ...this.props,
            status: "SENT",
            sunatResponseCode,
            sentToSunatAt: new Date(),
            updatedAt: new Date(),
        });
    }
    markAsAccepted() {
        if (this.props.status !== "SENT") {
            throw new Error("Solo se pueden aceptar notas de débito en estado SENT");
        }
        return new DebitNote({
            ...this.props,
            status: "ACCEPTED",
            updatedAt: new Date(),
        });
    }
    markAsRejected(reason) {
        if (this.props.status !== "SENT") {
            throw new Error("Solo se pueden rechazar notas de débito en estado SENT");
        }
        return new DebitNote({
            ...this.props,
            status: "REJECTED",
            reason,
            updatedAt: new Date(),
        });
    }
    canBeModified() {
        return this.props.status === "DRAFT";
    }
    equals(other) {
        if (!other)
            return false;
        return this.props.id === other.props.id;
    }
    getFullNumber() {
        return `${this.props.series.toString()}-${this.props.number.toString().padStart(8, "0")}`;
    }
    get id() {
        return this.props.id;
    }
    get referenceInvoiceId() {
        return this.props.referenceInvoiceId;
    }
    get additionalAmount() {
        return this.props.additionalAmount;
    }
    get totalAmount() {
        return this.props.totalAmount;
    }
    get baseAmount() {
        return this.props.baseAmount;
    }
    get igvAmount() {
        return this.props.igvAmount;
    }
    get currency() {
        return this.props.currency;
    }
    get reason() {
        return this.props.reason;
    }
    get series() {
        return this.props.series;
    }
    get number() {
        return this.props.number;
    }
    get status() {
        return this.props.status;
    }
    get sunatResponseCode() {
        return this.props.sunatResponseCode;
    }
    get sentToSunatAt() {
        return this.props.sentToSunatAt;
    }
    get issueDate() {
        return this.props.issueDate;
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
            referenceInvoiceId: this.props.referenceInvoiceId,
            additionalAmount: this.props.additionalAmount.toJSON(),
            totalAmount: this.props.totalAmount.toJSON(),
            baseAmount: this.props.baseAmount.toJSON(),
            igvAmount: this.props.igvAmount.toJSON(),
            currency: this.props.currency,
            reason: this.props.reason,
            series: this.props.series.toString(),
            number: this.props.number,
            status: this.props.status,
            sunatResponseCode: this.props.sunatResponseCode,
            sentToSunatAt: this.props.sentToSunatAt?.toISOString(),
            issueDate: this.props.issueDate.toISOString(),
            createdAt: this.props.createdAt.toISOString(),
            updatedAt: this.props.updatedAt.toISOString(),
        };
    }
}
//# sourceMappingURL=DebitNote.js.map