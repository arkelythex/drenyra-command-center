export interface XsdSchema {
    targetNamespace: string;
    elementFormDefault: "qualified" | "unqualified";
    attributeFormDefault: "qualified" | "unqualified";
    elements: Map<string, XsdElementDef>;
    types: Map<string, XsdComplexType | XsdSimpleType>;
}
export interface XsdElementDef {
    name: string;
    type?: string;
    ref?: string;
    minOccurs: number;
    maxOccurs: number | "unbounded";
    nillable?: boolean;
    children?: XsdElementDef[];
    attributes?: XsdAttributeDef[];
}
export interface XsdComplexType {
    name: string;
    mixed?: boolean;
    sequence?: XsdElementDef[];
    choice?: XsdElementDef[];
    all?: XsdElementDef[];
    attributes?: XsdAttributeDef[];
}
export interface XsdSimpleType {
    name: string;
    restriction?: {
        base: string;
        enumerations?: string[];
    };
}
export interface XsdAttributeDef {
    name: string;
    type?: string;
    use?: "required" | "optional" | "prohibited";
}
export interface XsdValidationResult {
    valid: boolean;
    errors: XsdValidationError[];
    warnings: XsdValidationError[];
}
export interface XsdValidationError {
    code: string;
    message: string;
    path: string;
    severity: "ERROR" | "WARNING";
}
export interface ResolvedElementRef {
    namespace: string;
    localName: string;
    prefix: string;
}
export type DocumentType = "Invoice" | "CreditNote";
export declare const UBL_NAMESPACE_PREFIXES: {
    readonly cac: "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2";
    readonly cbc: "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2";
    readonly ext: "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2";
    readonly sac: "urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2";
    readonly sbc: "urn:oasis:names:specification:ubl:schema:xsd:SignatureBasicComponents-2";
};
export declare const UBL_DOCUMENT_NAMESPACES: {
    readonly Invoice: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2";
    readonly CreditNote: "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2";
};
export declare const XSD_FILE_NAMESPACE_MAP: Record<string, string>;
//# sourceMappingURL=types.d.ts.map