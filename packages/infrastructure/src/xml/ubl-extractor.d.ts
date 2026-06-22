import type { InvoiceItem, UBLNode, UBLNodeObject } from "./ubl-parser.types";
export declare function extractText(obj: UBLNode, ...paths: string[]): string;
export declare function extractNumber(obj: UBLNode, ...paths: string[]): number;
export declare function extractSupplierRuc(invoice: UBLNodeObject): string;
export declare function extractSupplierName(invoice: UBLNodeObject): string;
export declare function extractCustomerRuc(invoice: UBLNodeObject): string;
export declare function extractCustomerName(invoice: UBLNodeObject): string;
export declare function extractSubtotal(invoice: UBLNodeObject): number;
export declare function extractIGV(invoice: UBLNodeObject): number;
export declare function extractTotal(invoice: UBLNodeObject): number;
export declare function extractCurrency(invoice: UBLNodeObject): string;
export declare function extractItems(invoice: UBLNodeObject): InvoiceItem[];
//# sourceMappingURL=ubl-extractor.d.ts.map