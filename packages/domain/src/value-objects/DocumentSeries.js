import { InvalidDocumentSeriesError } from "../errors/InvalidDocumentSeriesError";
export class DocumentSeries {
    value;
    documentType;
    constructor(value, documentType) {
        this.value = value;
        this.documentType = documentType;
        Object.freeze(this);
    }
    static create(value) {
        const trimmed = value.trim().toUpperCase();
        if (!DocumentSeries.isValid(trimmed)) {
            throw new InvalidDocumentSeriesError(value);
        }
        const documentType = DocumentSeries.detectDocumentType(trimmed);
        return new DocumentSeries(trimmed, documentType);
    }
    static isValid(series) {
        const pattern = /^(F\d{3}|B\d{3}|FC\d{2}|BC\d{2}|FD\d{2}|BD\d{2})$/;
        return pattern.test(series);
    }
    static detectDocumentType(series) {
        if (series.startsWith("FC"))
            return "NOTA_CREDITO_FACTURA";
        if (series.startsWith("BC"))
            return "NOTA_CREDITO_BOLETA";
        if (series.startsWith("FD"))
            return "NOTA_DEBITO_FACTURA";
        if (series.startsWith("BD"))
            return "NOTA_DEBITO_BOLETA";
        if (series.startsWith("F"))
            return "FACTURA";
        if (series.startsWith("B"))
            return "BOLETA";
        throw new InvalidDocumentSeriesError(series);
    }
    toString() {
        return this.value;
    }
    getDocumentType() {
        return this.documentType;
    }
    isFactura() {
        return this.documentType === "FACTURA";
    }
    isBoleta() {
        return this.documentType === "BOLETA";
    }
    isCreditNote() {
        return (this.documentType === "NOTA_CREDITO_FACTURA" ||
            this.documentType === "NOTA_CREDITO_BOLETA");
    }
    isDebitNote() {
        return (this.documentType === "NOTA_DEBITO_FACTURA" ||
            this.documentType === "NOTA_DEBITO_BOLETA");
    }
    getNumericPart() {
        const match = this.value.match(/\d+$/);
        return match ? Number.parseInt(match[0], 10) : 0;
    }
    getPrefix() {
        return this.value.replace(/\d+$/, "");
    }
    equals(other) {
        if (!other) {
            return false;
        }
        return this.value === other.value;
    }
    toJSON() {
        return {
            value: this.value,
            documentType: this.documentType,
        };
    }
    static fromJSON(json) {
        return DocumentSeries.create(json.value);
    }
}
//# sourceMappingURL=DocumentSeries.js.map