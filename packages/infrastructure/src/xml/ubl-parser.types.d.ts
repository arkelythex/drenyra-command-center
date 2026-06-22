type UBLNode = string | number | boolean | null | undefined | UBLNodeObject | UBLNode[];
interface UBLNodeObject {
    [key: string]: UBLNode;
    "#text"?: string | number;
    "@_unitCode"?: string;
    "@_currencyID"?: string;
}
interface UBLDocument {
    Invoice?: UBLNodeObject;
    CreditNote?: UBLNodeObject;
    DebitNote?: UBLNodeObject;
}
export interface InvoiceItem {
    id?: string;
    description: string;
    quantity: number;
    unitCode?: string;
    unitPrice: number;
    lineTotal: number;
    igvAmount?: number;
}
export interface ParsedInvoice {
    id: string;
    issueDate: string;
    dueDate?: string;
    supplierRuc: string;
    supplierName: string;
    customerRuc?: string;
    customerName?: string;
    subtotal: number;
    igv: number;
    totalAmount: number;
    currency: string;
    items: InvoiceItem[];
    rawXml?: string;
}
export interface ParseResult {
    success: boolean;
    data?: ParsedInvoice;
    error?: string;
}
export type { UBLDocument, UBLNode, UBLNodeObject };
//# sourceMappingURL=ubl-parser.types.d.ts.map