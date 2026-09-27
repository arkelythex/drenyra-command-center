import type { DocumentType, XsdSchema, XsdValidationResult } from "./types";
export declare const XSD_ERROR_CODES: {
    readonly ROOT_ELEMENT_MISMATCH: "XSD_ROOT_ELEMENT_MISMATCH";
    readonly MISSING_REQUIRED_ELEMENT: "XSD_MISSING_REQUIRED_ELEMENT";
    readonly MAX_OCCURS_EXCEEDED: "XSD_MAX_OCCURS_EXCEEDED";
    readonly MISSING_REQUIRED_ATTRIBUTE: "XSD_MISSING_REQUIRED_ATTRIBUTE";
    readonly UNKNOWN_ELEMENT: "XSD_UNKNOWN_ELEMENT";
    readonly ELEMENT_OUT_OF_ORDER: "XSD_ELEMENT_OUT_OF_ORDER";
    readonly SCHEMA_NOT_AVAILABLE: "XSD_SCHEMA_NOT_AVAILABLE";
    readonly XML_PARSE_ERROR: "XSD_XML_PARSE_ERROR";
};
export declare class XsdValidator {
    private loader;
    private parser;
    private schemas;
    constructor(xsdDir: string);
    loadSchemas(): boolean;
    hasSchemas(): boolean;
    validate(xmlContent: string, docType: DocumentType): XsdValidationResult;
    getAllSchemas(): Map<string, XsdSchema>;
    private getSchemaForDocType;
    private findRootTag;
    private resolveType;
    private resolveElementDef;
    private validateSequence;
    private validateChildElements;
    private countChildElements;
    private getXmlChildData;
    private getLocalTagName;
    private stripPrefix;
}
export declare function validateUblDocument(xmlContent: string, docType: DocumentType, xsdDir: string): XsdValidationResult;
//# sourceMappingURL=xsd-validator.d.ts.map