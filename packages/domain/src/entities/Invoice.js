import { DNI } from "../value-objects/DNI";
import { DocumentSeries } from "../value-objects/DocumentSeries";
import { Money } from "../value-objects/Money";
import { RUC } from "../value-objects/RUC";
export class Invoice {
    props;
    constructor(props) {
        this.props = props;
        this.validateBusinessRules();
        Object.freeze(this);
    }
    static create(props) {
        return new Invoice(props);
    }
    static fromPrimitives(plainData) {
        const currency = plainData.currency;
        let buyerTaxId;
        if (plainData.buyerTaxId && plainData.buyerTaxType) {
            if (plainData.buyerTaxType === "RUC") {
                buyerTaxId = RUC.create(plainData.buyerTaxId);
            }
            else if (plainData.buyerTaxType === "DNI") {
                buyerTaxId = DNI.create(plainData.buyerTaxId);
            }
        }
        else if (plainData.clientRUC) {
            buyerTaxId = RUC.create(plainData.clientRUC);
        }
        else if (plainData.clientDNI) {
            buyerTaxId = DNI.create(plainData.clientDNI);
        }
        const props = {
            id: plainData.id,
            series: DocumentSeries.create(plainData.series),
            number: Number(plainData.number),
            issueDate: new Date(plainData.issueDate),
            dueDate: plainData.dueDate ? new Date(plainData.dueDate) : undefined,
            clientName: plainData.clientName,
            buyerTaxId,
            clientRUC: plainData.clientRUC
                ? RUC.create(plainData.clientRUC)
                : undefined,
            clientDNI: plainData.clientDNI
                ? DNI.create(plainData.clientDNI)
                : undefined,
            clientAddress: plainData.clientAddress,
            baseAmount: Money.fromCents(plainData.baseAmount, currency),
            taxAmount: plainData.taxAmount != null
                ? Money.fromCents(plainData.taxAmount, currency)
                : Money.fromCents(plainData.igvAmount, currency),
            igvAmount: Money.fromCents(plainData.igvAmount, currency),
            totalAmount: Money.fromCents(plainData.totalAmount, currency),
            status: plainData.status,
            fiscalStatus: (plainData.fiscalStatus ??
                plainData.status),
            items: (plainData.items || []).map((item) => ({
                id: item.id,
                description: item.description,
                quantity: Number(item.quantity),
                unitPrice: Money.fromCents(item.unitPrice, currency),
                subtotal: Money.fromCents(item.subtotal, currency),
                igv: Money.fromCents(item.igv, currency),
                total: Money.fromCents(item.total, currency),
            })),
            notes: plainData.notes,
            sunatResponseCode: plainData.sunatResponseCode,
            sentToSunatAt: plainData.sentToSunatAt
                ? new Date(plainData.sentToSunatAt)
                : undefined,
            createdAt: plainData.createdAt
                ? new Date(plainData.createdAt)
                : new Date(),
            updatedAt: plainData.updatedAt
                ? new Date(plainData.updatedAt)
                : new Date(),
        };
        return new Invoice(props);
    }
    validateBusinessRules() {
        if (this.props.series.isFactura() && !this.props.clientRUC) {
            throw new Error("Las facturas requieren RUC del cliente (regla SUNAT)");
        }
        const expectedTotal = this.props.baseAmount.add(this.props.igvAmount);
        if (!this.props.totalAmount.equals(expectedTotal)) {
            throw new Error(`El total (${this.props.totalAmount.getAmount()}) debe ser igual a base + IGV (${expectedTotal.getAmount()})`);
        }
        if (this.props.items.length === 0) {
            throw new Error("La factura debe tener al menos un item");
        }
        const itemsTotal = this.calculateItemsTotal();
        if (!itemsTotal.equals(this.props.totalAmount)) {
            throw new Error(`La suma de items (${itemsTotal.getAmount()}) no coincide con el total (${this.props.totalAmount.getAmount()})`);
        }
        if (this.props.issueDate > new Date()) {
            throw new Error("La fecha de emisión no puede ser futura");
        }
        if (this.props.dueDate && this.props.dueDate < this.props.issueDate) {
            throw new Error("La fecha de vencimiento debe ser posterior a la emisión");
        }
        if (this.props.number <= 0) {
            throw new Error("El número de factura debe ser positivo");
        }
    }
    calculateItemsTotal() {
        return this.props.items.reduce((acc, item) => acc.add(item.total), Money.zero(this.props.totalAmount.getCurrency()));
    }
    getFullNumber() {
        return `${this.props.series.toString()}-${this.props.number.toString().padStart(8, "0")}`;
    }
    markAsSent(authorityResponseCode) {
        const currentStatus = this.props.fiscalStatus ?? this.props.status;
        if (currentStatus !== "PENDING_REVIEW" && this.props.status !== "PENDING") {
            throw new Error("Solo se pueden enviar facturas en estado PENDING");
        }
        return new Invoice({
            ...this.props,
            status: "SENT",
            fiscalStatus: "SUBMITTED",
            sunatResponseCode: authorityResponseCode,
            sentToSunatAt: new Date(),
            updatedAt: new Date(),
        });
    }
    markAsAccepted() {
        const currentStatus = this.props.fiscalStatus ?? this.props.status;
        if (currentStatus !== "SUBMITTED" && this.props.status !== "SENT") {
            throw new Error("Solo se pueden aceptar facturas en estado SENT");
        }
        return new Invoice({
            ...this.props,
            status: "ACCEPTED",
            fiscalStatus: "ACCEPTED",
            updatedAt: new Date(),
        });
    }
    markAsRejected(reason) {
        const currentStatus = this.props.fiscalStatus ?? this.props.status;
        if (currentStatus !== "SUBMITTED" && this.props.status !== "SENT") {
            throw new Error("Solo se pueden rechazar facturas en estado SENT");
        }
        return new Invoice({
            ...this.props,
            status: "REJECTED",
            fiscalStatus: "REJECTED",
            notes: reason,
            updatedAt: new Date(),
        });
    }
    cancel() {
        const currentStatus = this.props.fiscalStatus ?? this.props.status;
        if (currentStatus === "SUBMITTED" ||
            currentStatus === "ACCEPTED" ||
            this.props.status === "SENT" ||
            this.props.status === "ACCEPTED") {
            throw new Error("No se pueden cancelar facturas enviadas a SUNAT. Use Nota de Crédito.");
        }
        return new Invoice({
            ...this.props,
            status: "CANCELLED",
            fiscalStatus: "CANCELLED",
            updatedAt: new Date(),
        });
    }
    canBeModified() {
        const s = this.props.fiscalStatus ?? this.props.status;
        return (s === "DRAFT" || s === "PENDING_REVIEW" || this.props.status === "PENDING");
    }
    isOverdue() {
        if (!this.props.dueDate) {
            return false;
        }
        const s = this.props.fiscalStatus ?? this.props.status;
        return this.props.dueDate < new Date() && s !== "CANCELLED";
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
    get series() {
        return this.props.series;
    }
    get number() {
        return this.props.number;
    }
    get issueDate() {
        return this.props.issueDate;
    }
    get dueDate() {
        return this.props.dueDate;
    }
    get clientName() {
        return this.props.clientName;
    }
    get clientRUC() {
        return this.props.clientRUC;
    }
    get clientDNI() {
        return this.props.clientDNI;
    }
    get clientAddress() {
        return this.props.clientAddress;
    }
    get baseAmount() {
        return this.props.baseAmount;
    }
    get igvAmount() {
        return this.props.igvAmount;
    }
    get totalAmount() {
        return this.props.totalAmount;
    }
    get status() {
        return this.props.status;
    }
    get items() {
        return this.props.items;
    }
    get notes() {
        return this.props.notes;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get sentToSunatAt() {
        return this.props.sentToSunatAt;
    }
    get sunatResponseCode() {
        return this.props.sunatResponseCode;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    get buyerTaxId() {
        return this.props.buyerTaxId;
    }
    get taxAmount() {
        return this.props.taxAmount;
    }
    get fiscalStatus() {
        return this.props.fiscalStatus;
    }
    toJSON() {
        return {
            id: this.props.id,
            series: this.props.series.toString(),
            number: this.props.number,
            issueDate: this.props.issueDate.toISOString(),
            dueDate: this.props.dueDate?.toISOString(),
            clientName: this.props.clientName,
            buyerTaxId: this.props.buyerTaxId?.toString(),
            buyerTaxType: this.props.buyerTaxId?.type,
            taxAmount: this.props.taxAmount?.toJSON(),
            fiscalStatus: this.props.fiscalStatus,
            clientRUC: this.props.clientRUC?.toString(),
            clientDNI: this.props.clientDNI?.toString(),
            clientAddress: this.props.clientAddress,
            baseAmount: this.props.baseAmount.toJSON(),
            igvAmount: this.props.igvAmount.toJSON(),
            totalAmount: this.props.totalAmount.toJSON(),
            status: this.props.status,
            items: this.props.items,
            notes: this.props.notes,
            sunatResponseCode: this.props.sunatResponseCode,
            sentToSunatAt: this.props.sentToSunatAt?.toISOString(),
            createdAt: this.props.createdAt.toISOString(),
            updatedAt: this.props.updatedAt.toISOString(),
        };
    }
}
//# sourceMappingURL=Invoice.js.map