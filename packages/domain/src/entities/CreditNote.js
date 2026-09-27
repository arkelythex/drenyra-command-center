import { DocumentSeries } from "../value-objects/DocumentSeries";
import { Money } from "../value-objects/Money";
export class CreditNote {
    props;
    constructor(props) {
        this.props = props;
        this.validateBusinessRules();
        Object.freeze(this);
    }
    static create(props) {
        return new CreditNote(props);
    }
    static fromPrimitives(data) {
        const currency = data.currency;
        const props = {
            id: data.id,
            referenceInvoiceId: data.referenceInvoiceId,
            referenceInvoiceTotal: data.referenceInvoiceTotal,
            creditNoteType: data.creditNoteType,
            reason: data.reason,
            series: DocumentSeries.create(data.series),
            number: data.number,
            totalAmount: Money.fromCents(data.totalAmount, currency),
            baseAmount: Money.fromCents(data.baseAmount, currency),
            igvAmount: Money.fromCents(data.igvAmount, currency),
            currency,
            status: data.status,
            sunatResponseCode: data.sunatResponseCode,
            sentToSunatAt: data.sentToSunatAt
                ? new Date(data.sentToSunatAt)
                : undefined,
            issueDate: new Date(data.issueDate),
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        };
        return new CreditNote(props);
    }
    validateBusinessRules() {
        if (!this.props.series.isCreditNote()) {
            throw new Error(`Serie inválida para nota de crédito: ${this.props.series.toString()}. Debe ser FC01 o BC01.`);
        }
        const expectedTotal = this.props.baseAmount.add(this.props.igvAmount);
        if (!this.props.totalAmount.equals(expectedTotal)) {
            throw new Error(`El total (${this.props.totalAmount.getAmount()}) debe ser igual a base + IGV (${expectedTotal.getAmount()})`);
        }
        if (this.props.referenceInvoiceTotal !== undefined) {
            const currentAmount = this.props.totalAmount.getCents();
            if (currentAmount > this.props.referenceInvoiceTotal) {
                throw new Error(`El monto de la nota de crédito (${currentAmount}) no puede exceder el total de la factura referenciada (${this.props.referenceInvoiceTotal})`);
            }
        }
        if (this.props.issueDate > new Date()) {
            throw new Error("La fecha de emisión no puede ser futura");
        }
        if (this.props.number <= 0) {
            throw new Error("El número de nota de crédito debe ser positivo");
        }
        if (!this.props.reason || this.props.reason.trim().length === 0) {
            throw new Error("La nota de crédito debe tener una razón");
        }
    }
    markAsSent(sunatResponseCode) {
        if (this.props.status !== "DRAFT") {
            throw new Error("Solo se pueden enviar notas de crédito en estado DRAFT");
        }
        return new CreditNote({
            ...this.props,
            status: "SENT",
            sunatResponseCode,
            sentToSunatAt: new Date(),
            updatedAt: new Date(),
        });
    }
    markAsAccepted() {
        if (this.props.status !== "SENT") {
            throw new Error("Solo se pueden aceptar notas de crédito en estado SENT");
        }
        return new CreditNote({
            ...this.props,
            status: "ACCEPTED",
            updatedAt: new Date(),
        });
    }
    markAsRejected(reason) {
        if (this.props.status !== "SENT") {
            throw new Error("Solo se pueden rechazar notas de crédito en estado SENT");
        }
        return new CreditNote({
            ...this.props,
            status: "REJECTED",
            reason,
            updatedAt: new Date(),
        });
    }
    isFullCancellation() {
        return this.props.creditNoteType === "ANULACION";
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
    get referenceInvoiceTotal() {
        return this.props.referenceInvoiceTotal;
    }
    get creditNoteType() {
        return this.props.creditNoteType;
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
            referenceInvoiceTotal: this.props.referenceInvoiceTotal,
            creditNoteType: this.props.creditNoteType,
            reason: this.props.reason,
            series: this.props.series.toString(),
            number: this.props.number,
            totalAmount: this.props.totalAmount.toJSON(),
            baseAmount: this.props.baseAmount.toJSON(),
            igvAmount: this.props.igvAmount.toJSON(),
            currency: this.props.currency,
            status: this.props.status,
            sunatResponseCode: this.props.sunatResponseCode,
            sentToSunatAt: this.props.sentToSunatAt?.toISOString(),
            issueDate: this.props.issueDate.toISOString(),
            createdAt: this.props.createdAt.toISOString(),
            updatedAt: this.props.updatedAt.toISOString(),
        };
    }
}
//# sourceMappingURL=CreditNote.js.map