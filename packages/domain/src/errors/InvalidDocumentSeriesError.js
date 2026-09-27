export class InvalidDocumentSeriesError extends Error {
    constructor(series) {
        super(`Serie de documento inválida: "${series}". Formato válido: F001 (Factura), B001 (Boleta), FC01 (Nota Crédito), etc.`);
        this.name = "InvalidDocumentSeriesError";
        Object.setPrototypeOf(this, InvalidDocumentSeriesError.prototype);
    }
}
//# sourceMappingURL=InvalidDocumentSeriesError.js.map