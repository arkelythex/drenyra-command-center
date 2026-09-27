import type { DocumentType, XsdElementDef, XsdSchema } from "./types";
export declare class XsdSchemaLoader {
    private parser;
    private xsdDir;
    private loadedFiles;
    private parsedSchemas;
    constructor(xsdDir: string);
    loadSchemaFile(fileName: string): XsdSchema;
    loadAllSchemas(): Map<string, XsdSchema>;
    getSchemaForDocumentType(docType: DocumentType, allSchemas: Map<string, XsdSchema>): XsdSchema | undefined;
    clearCache(): void;
    private buildSchema;
    private parseRawElement;
    private parseRawComplexType;
    private parseRawSimpleType;
    private parseRawAttribute;
    private parseSequenceElements;
    private parseChoiceElements;
    private parseAllElements;
    private normalizeArray;
}
export declare function resolvePrefixedElement(prefixedName: string, docNs: Map<string, string>, allSchemas: Map<string, XsdSchema>): XsdElementDef | undefined;
export declare function extractNamespaceMap(xmlContent: string): Map<string, string>;
//# sourceMappingURL=xsd-schema-loader.d.ts.map