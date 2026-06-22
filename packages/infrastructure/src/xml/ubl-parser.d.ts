import type { ParsedInvoice, ParseResult } from "./ubl-parser.types";
export declare class UBLParser {
    private parser;
    constructor();
    parseInvoice(xmlContent: string): ParsedInvoice;
    safeParse(xmlContent: string): ParseResult;
    isValidUBL(xmlContent: string): boolean;
}
export type { InvoiceItem, ParsedInvoice, ParseResult, } from "./ubl-parser.types";
export declare function isValidSunatXML(content: string): boolean;
//# sourceMappingURL=ubl-parser.d.ts.map