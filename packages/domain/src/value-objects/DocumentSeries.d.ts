export type DocumentType = "FACTURA" | "BOLETA" | "NOTA_CREDITO_FACTURA" | "NOTA_CREDITO_BOLETA" | "NOTA_DEBITO_FACTURA" | "NOTA_DEBITO_BOLETA";
export declare class DocumentSeries {
    private readonly value;
    private readonly documentType;
    private constructor();
    static create(value: string): DocumentSeries;
    private static isValid;
    private static detectDocumentType;
    toString(): string;
    getDocumentType(): DocumentType;
    isFactura(): boolean;
    isBoleta(): boolean;
    isCreditNote(): boolean;
    isDebitNote(): boolean;
    getNumericPart(): number;
    getPrefix(): string;
    equals(other: DocumentSeries | null | undefined): boolean;
    toJSON(): {
        value: string;
        documentType: DocumentType;
    };
    static fromJSON(json: {
        value: string;
    }): DocumentSeries;
}
//# sourceMappingURL=DocumentSeries.d.ts.map