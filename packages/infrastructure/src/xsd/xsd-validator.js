import { XMLParser, XMLValidator } from "fast-xml-parser";
import { UBL_DOCUMENT_NAMESPACES } from "./types";
import { extractNamespaceMap, resolvePrefixedElement, XsdSchemaLoader, } from "./xsd-schema-loader";
export const XSD_ERROR_CODES = {
    ROOT_ELEMENT_MISMATCH: "XSD_ROOT_ELEMENT_MISMATCH",
    MISSING_REQUIRED_ELEMENT: "XSD_MISSING_REQUIRED_ELEMENT",
    MAX_OCCURS_EXCEEDED: "XSD_MAX_OCCURS_EXCEEDED",
    MISSING_REQUIRED_ATTRIBUTE: "XSD_MISSING_REQUIRED_ATTRIBUTE",
    UNKNOWN_ELEMENT: "XSD_UNKNOWN_ELEMENT",
    ELEMENT_OUT_OF_ORDER: "XSD_ELEMENT_OUT_OF_ORDER",
    SCHEMA_NOT_AVAILABLE: "XSD_SCHEMA_NOT_AVAILABLE",
    XML_PARSE_ERROR: "XSD_XML_PARSE_ERROR",
};
export class XsdValidator {
    loader;
    parser;
    schemas = null;
    constructor(xsdDir) {
        this.loader = new XsdSchemaLoader(xsdDir);
        this.parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_",
            removeNSPrefix: false,
            parseTagValue: true,
            parseAttributeValue: true,
            trimValues: true,
            processEntities: false,
        });
    }
    loadSchemas() {
        try {
            this.schemas = this.loader.loadAllSchemas();
            return true;
        }
        catch {
            this.schemas = null;
            return false;
        }
    }
    hasSchemas() {
        return this.schemas !== null && this.schemas.size > 0;
    }
    validate(xmlContent, docType) {
        const errors = [];
        const warnings = [];
        const validation = XMLValidator.validate(xmlContent);
        if (validation !== true) {
            errors.push({
                code: XSD_ERROR_CODES.XML_PARSE_ERROR,
                message: `XML is not well-formed: ${validation.err?.msg ?? "Unknown error"}`,
                path: "/",
                severity: "ERROR",
            });
            return { valid: false, errors, warnings };
        }
        let parsedXml;
        try {
            parsedXml = this.parser.parse(xmlContent);
        }
        catch (error) {
            errors.push({
                code: XSD_ERROR_CODES.XML_PARSE_ERROR,
                message: `Failed to parse XML: ${error instanceof Error ? error.message : "Unknown error"}`,
                path: "/",
                severity: "ERROR",
            });
            return { valid: false, errors, warnings };
        }
        const docSchema = this.getSchemaForDocType(docType);
        if (!docSchema) {
            warnings.push({
                code: XSD_ERROR_CODES.SCHEMA_NOT_AVAILABLE,
                message: `XSD schema not available for document type: ${docType}. Skipping XSD validation.`,
                path: "/",
                severity: "WARNING",
            });
            return { valid: true, errors, warnings };
        }
        const nsMap = extractNamespaceMap(xmlContent);
        const rootTag = this.findRootTag(docType, parsedXml);
        if (!rootTag) {
            errors.push({
                code: XSD_ERROR_CODES.ROOT_ELEMENT_MISMATCH,
                message: `Document must have <${docType}> as root element`,
                path: "/",
                severity: "ERROR",
            });
            return { valid: errors.length === 0, errors, warnings };
        }
        const rootElementDef = docSchema.elements.get(docType);
        if (!rootElementDef) {
            errors.push({
                code: XSD_ERROR_CODES.ROOT_ELEMENT_MISMATCH,
                message: `Root element <${docType}> not found in schema`,
                path: `/${docType}`,
                severity: "ERROR",
            });
            return { valid: errors.length === 0, errors, warnings };
        }
        const rootType = this.resolveType(rootElementDef.type ?? "", docSchema);
        if (rootType && "sequence" in rootType && rootType.sequence) {
            this.validateSequence(rootTag, rootType.sequence, nsMap, `/${docType}`, errors, warnings);
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
    getAllSchemas() {
        return this.schemas ?? new Map();
    }
    getSchemaForDocType(docType) {
        if (!this.schemas)
            return undefined;
        const targetNs = UBL_DOCUMENT_NAMESPACES[docType];
        if (this.schemas.has(targetNs)) {
            return this.schemas.get(targetNs);
        }
        for (const [, schema] of this.schemas) {
            if (schema.elements.has(docType)) {
                return schema;
            }
        }
        return undefined;
    }
    findRootTag(docType, parsedXml) {
        const possibleKeys = [docType, `Invoice`, `CreditNote`];
        for (const key of possibleKeys) {
            const value = parsedXml[key];
            if (value && typeof value === "object") {
                return value;
            }
        }
        return undefined;
    }
    resolveType(typeName, currentSchema) {
        if (!typeName)
            return undefined;
        const localName = typeName.includes(":")
            ? typeName.split(":")[1]
            : typeName;
        const localType = currentSchema.types.get(localName);
        if (localType && "sequence" in localType) {
            return localType;
        }
        if (this.schemas) {
            for (const [, schema] of this.schemas) {
                const found = schema.types.get(localName);
                if (found && "sequence" in found) {
                    return found;
                }
            }
        }
        return undefined;
    }
    resolveElementDef(elementDef, nsMap) {
        if (!elementDef.ref)
            return elementDef;
        const resolved = resolvePrefixedElement(elementDef.ref, nsMap, this.schemas ?? new Map());
        return resolved;
    }
    validateSequence(parentXml, sequence, nsMap, path, errors, warnings) {
        const xmlChildCounts = this.countChildElements(parentXml);
        for (const schemaElement of sequence) {
            if (schemaElement.ref === "ext:UBLExtensions") {
                continue;
            }
            if (schemaElement.ref?.startsWith("ext:")) {
                continue;
            }
            const resolvedDef = this.resolveElementDef(schemaElement, nsMap);
            if (!resolvedDef)
                continue;
            const tagName = schemaElement.ref
                ? this.getLocalTagName(schemaElement.ref)
                : schemaElement.name;
            const xmlCount = xmlChildCounts.get(tagName) ?? 0;
            if (schemaElement.minOccurs > 0 && xmlCount < schemaElement.minOccurs) {
                errors.push({
                    code: XSD_ERROR_CODES.MISSING_REQUIRED_ELEMENT,
                    message: `Required element <${tagName}> is missing (minOccurs: ${schemaElement.minOccurs})`,
                    path: `${path}/${tagName}`,
                    severity: "ERROR",
                });
            }
            const maxOccurs = schemaElement.maxOccurs === "unbounded"
                ? Number.MAX_SAFE_INTEGER
                : schemaElement.maxOccurs;
            if (xmlCount > maxOccurs) {
                errors.push({
                    code: XSD_ERROR_CODES.MAX_OCCURS_EXCEEDED,
                    message: `Element <${tagName}> appears ${xmlCount} times, but maxOccurs is ${maxOccurs === Number.MAX_SAFE_INTEGER ? "unbounded" : String(maxOccurs)}`,
                    path: `${path}/${tagName}`,
                    severity: "ERROR",
                });
            }
            if (resolvedDef.type && xmlCount > 0) {
                this.validateChildElements(parentXml, tagName, resolvedDef, nsMap, `${path}/${tagName}`, errors, warnings);
            }
        }
    }
    validateChildElements(parentXml, tagName, elementDef, nsMap, path, errors, warnings) {
        if (elementDef.children && elementDef.children.length > 0) {
            const xmlData = this.getXmlChildData(parentXml, tagName);
            if (xmlData) {
                this.validateSequence(xmlData, elementDef.children, nsMap, path, errors, warnings);
            }
            return;
        }
        if (!elementDef.type || !this.schemas)
            return;
        const localName = elementDef.type.includes(":")
            ? elementDef.type.split(":")[1]
            : elementDef.type;
        for (const [, schema] of this.schemas) {
            const typeDef = schema.types.get(localName);
            if (typeDef && "sequence" in typeDef && typeDef.sequence) {
                const xmlData = this.getXmlChildData(parentXml, tagName);
                if (xmlData) {
                    this.validateSequence(xmlData, typeDef.sequence, nsMap, path, errors, warnings);
                }
                return;
            }
        }
    }
    countChildElements(xml) {
        const counts = new Map();
        for (const key of Object.keys(xml)) {
            const localName = this.stripPrefix(key);
            const value = xml[key];
            if (key.startsWith("@_"))
                continue;
            if (Array.isArray(value)) {
                counts.set(localName, (counts.get(localName) ?? 0) + value.length);
            }
            else if (typeof value === "object" && value !== null) {
                counts.set(localName, (counts.get(localName) ?? 0) + 1);
            }
            else {
                counts.set(localName, (counts.get(localName) ?? 0) + 1);
            }
        }
        return counts;
    }
    getXmlChildData(parentXml, localTagName) {
        for (const key of Object.keys(parentXml)) {
            const localPart = this.stripPrefix(key);
            if (localPart === localTagName) {
                const value = parentXml[key];
                if (Array.isArray(value) && value.length > 0) {
                    return typeof value[0] === "object" && value[0] !== null
                        ? value[0]
                        : {};
                }
                if (typeof value === "object" && value !== null) {
                    return value;
                }
                return undefined;
            }
        }
        return undefined;
    }
    getLocalTagName(prefixedName) {
        const colonIndex = prefixedName.indexOf(":");
        return colonIndex === -1
            ? prefixedName
            : prefixedName.slice(colonIndex + 1);
    }
    stripPrefix(key) {
        const colonIndex = key.indexOf(":");
        return colonIndex === -1 ? key : key.slice(colonIndex + 1);
    }
}
export function validateUblDocument(xmlContent, docType, xsdDir) {
    const validator = new XsdValidator(xsdDir);
    validator.loadSchemas();
    return validator.validate(xmlContent, docType);
}
//# sourceMappingURL=xsd-validator.js.map