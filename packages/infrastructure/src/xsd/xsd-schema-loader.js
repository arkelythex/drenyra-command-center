import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { XMLParser } from "fast-xml-parser";
import { UBL_DOCUMENT_NAMESPACES, XSD_FILE_NAMESPACE_MAP } from "./types";
export class XsdSchemaLoader {
    parser;
    xsdDir;
    loadedFiles = new Map();
    parsedSchemas = new Map();
    constructor(xsdDir) {
        this.xsdDir = xsdDir;
        this.parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_",
            removeNSPrefix: false,
            parseTagValue: false,
            parseAttributeValue: false,
            trimValues: true,
            processEntities: false,
        });
    }
    loadSchemaFile(fileName) {
        const cacheKey = fileName;
        if (this.parsedSchemas.has(cacheKey)) {
            return this.parsedSchemas.get(cacheKey);
        }
        const filePath = resolve(this.xsdDir, fileName);
        if (!existsSync(filePath)) {
            throw new Error(`XSD file not found: ${filePath}`);
        }
        const xmlContent = readFileSync(filePath, "utf-8");
        const parsed = this.parser.parse(xmlContent);
        const schemaNode = parsed["xsd:schema"] ?? parsed["xs:schema"];
        if (!schemaNode) {
            throw new Error(`No xsd:schema root element found in ${fileName}`);
        }
        const imports = this.normalizeArray(schemaNode["xsd:import"] ?? schemaNode["xs:import"]);
        for (const imp of imports) {
            if (imp["@_schemaLocation"]) {
                const importedFile = imp["@_schemaLocation"].split("/").pop();
                if (importedFile?.endsWith(".xsd")) {
                    const importPath = resolve(this.xsdDir, importedFile);
                    if (existsSync(importPath)) {
                        this.loadSchemaFile(importedFile);
                    }
                }
            }
        }
        const includes = this.normalizeArray(schemaNode["xsd:include"] ?? schemaNode["xs:include"]);
        for (const inc of includes) {
            if (inc["@_schemaLocation"]) {
                const includedFile = inc["@_schemaLocation"].split("/").pop();
                if (includedFile?.endsWith(".xsd")) {
                    const includePath = resolve(this.xsdDir, includedFile);
                    if (existsSync(includePath)) {
                        this.loadSchemaFile(includedFile);
                    }
                }
            }
        }
        const schema = this.buildSchema(schemaNode, fileName);
        this.parsedSchemas.set(cacheKey, schema);
        return schema;
    }
    loadAllSchemas() {
        const schemas = new Map();
        for (const fileName of Object.keys(XSD_FILE_NAMESPACE_MAP)) {
            try {
                const schema = this.loadSchemaFile(fileName);
                schemas.set(schema.targetNamespace, schema);
            }
            catch {
            }
        }
        return schemas;
    }
    getSchemaForDocumentType(docType, allSchemas) {
        const targetNs = UBL_DOCUMENT_NAMESPACES[docType];
        if (allSchemas.has(targetNs)) {
            return allSchemas.get(targetNs);
        }
        const fileName = `UBL-${docType}-2.1.xsd`;
        for (const [, schema] of allSchemas) {
            const elements = schema.elements;
            if (elements.has(docType)) {
                return schema;
            }
        }
        if (this.parsedSchemas.has(fileName)) {
            return this.parsedSchemas.get(fileName);
        }
        return undefined;
    }
    clearCache() {
        this.loadedFiles.clear();
        this.parsedSchemas.clear();
    }
    buildSchema(raw, _fileName) {
        const schema = {
            targetNamespace: raw["@_targetNamespace"] ?? "",
            elementFormDefault: raw["@_elementFormDefault"] ??
                "unqualified",
            attributeFormDefault: raw["@_attributeFormDefault"] ??
                "unqualified",
            elements: new Map(),
            types: new Map(),
        };
        const rawElements = this.normalizeArray(raw["xsd:element"] ?? raw["xs:element"] ?? []);
        for (const rawEl of rawElements) {
            const element = this.parseRawElement(rawEl);
            if (element.name) {
                schema.elements.set(element.name, element);
            }
        }
        const rawComplexTypes = this.normalizeArray(raw["xsd:complexType"] ?? raw["xs:complexType"] ?? []);
        for (const rawCt of rawComplexTypes) {
            if (rawCt["@_name"]) {
                const complexType = this.parseRawComplexType(rawCt);
                schema.types.set(complexType.name, complexType);
            }
        }
        const rawSimpleTypes = this.normalizeArray(raw["xsd:simpleType"] ?? raw["xs:simpleType"] ?? []);
        for (const rawSt of rawSimpleTypes) {
            if (rawSt["@_name"]) {
                const simpleType = this.parseRawSimpleType(rawSt);
                schema.types.set(simpleType.name, simpleType);
            }
        }
        return schema;
    }
    parseRawElement(raw) {
        const element = {
            name: raw["@_name"] ?? "",
            type: raw["@_type"],
            ref: raw["@_ref"],
            minOccurs: raw["@_minOccurs"]
                ? Number.parseInt(raw["@_minOccurs"], 10)
                : 1,
            maxOccurs: raw["@_maxOccurs"] === "unbounded"
                ? "unbounded"
                : raw["@_maxOccurs"]
                    ? Number.parseInt(raw["@_maxOccurs"], 10)
                    : 1,
            nillable: raw["@_nillable"] === "true",
        };
        const inlineCt = raw["xsd:complexType"] ?? raw["xs:complexType"];
        if (inlineCt) {
            const parsed = this.parseRawComplexType(inlineCt);
            element.children = parsed.sequence ?? parsed.choice ?? parsed.all;
            element.attributes = parsed.attributes;
        }
        const _inlineSt = raw["xsd:simpleType"] ?? raw["xs:simpleType"];
        return element;
    }
    parseRawComplexType(raw) {
        const ct = {
            name: raw["@_name"] ?? "",
            mixed: raw["@_mixed"] === "true",
        };
        const simpleContent = raw["xsd:simpleContent"] ?? raw["xs:simpleContent"];
        if (simpleContent) {
            const extension = simpleContent["xsd:extension"] ?? simpleContent["xs:extension"];
            if (extension?.["@_base"]) {
                ct.name = raw["@_name"] ?? extension["@_base"];
            }
            return ct;
        }
        const sequence = raw["xsd:sequence"] ?? raw["xs:sequence"];
        if (sequence) {
            ct.sequence = this.parseSequenceElements(sequence);
        }
        const choice = raw["xsd:choice"] ?? raw["xs:choice"];
        if (choice) {
            ct.choice = this.parseChoiceElements(choice);
        }
        const all = raw["xsd:all"] ?? raw["xs:all"];
        if (all) {
            ct.all = this.parseAllElements(all);
        }
        const rawAttrs = this.normalizeArray(raw["xsd:attribute"] ?? raw["xs:attribute"] ?? []);
        if (rawAttrs.length > 0) {
            ct.attributes = rawAttrs.map((a) => this.parseRawAttribute(a));
        }
        return ct;
    }
    parseRawSimpleType(raw) {
        const st = {
            name: raw["@_name"] ?? "",
        };
        const restriction = raw["xsd:restriction"] ?? raw["xs:restriction"];
        if (restriction) {
            const enums = this.normalizeArray(restriction["xsd:enumeration"] ?? restriction["xs:enumeration"] ?? []);
            st.restriction = {
                base: restriction["@_base"],
                enumerations: enums.map((e) => e["@_value"]),
            };
        }
        return st;
    }
    parseRawAttribute(raw) {
        return {
            name: raw["@_name"] ?? raw["@_ref"] ?? "",
            type: raw["@_type"],
            use: raw["@_use"] ?? "optional",
        };
    }
    parseSequenceElements(sequence) {
        const elements = [];
        const rawElements = this.normalizeArray(sequence["xsd:element"] ?? sequence["xs:element"] ?? []);
        for (const raw of rawElements) {
            elements.push(this.parseRawElement(raw));
        }
        const nestedChoice = sequence["xsd:choice"] ?? sequence["xs:choice"];
        if (nestedChoice && !rawElements.length) {
            const choiceElements = this.parseChoiceElements(nestedChoice);
            elements.push(...choiceElements);
        }
        return elements;
    }
    parseChoiceElements(choice) {
        const elements = [];
        const rawElements = this.normalizeArray(choice["xsd:element"] ?? choice["xs:element"] ?? []);
        for (const raw of rawElements) {
            elements.push(this.parseRawElement(raw));
        }
        return elements;
    }
    parseAllElements(all) {
        const elements = [];
        const rawElements = this.normalizeArray(all["xsd:element"] ?? all["xs:element"] ?? []);
        for (const raw of rawElements) {
            elements.push(this.parseRawElement(raw));
        }
        return elements;
    }
    normalizeArray(value) {
        if (value == null)
            return [];
        return Array.isArray(value) ? value : [value];
    }
}
export function resolvePrefixedElement(prefixedName, docNs, allSchemas) {
    const colonIndex = prefixedName.indexOf(":");
    if (colonIndex === -1) {
        for (const [, schema] of allSchemas) {
            if (schema.elements.has(prefixedName)) {
                return schema.elements.get(prefixedName);
            }
        }
        return undefined;
    }
    const prefix = prefixedName.slice(0, colonIndex);
    const localName = prefixedName.slice(colonIndex + 1);
    const ns = docNs.get(prefix);
    if (!ns)
        return undefined;
    const schema = allSchemas.get(ns);
    if (!schema)
        return undefined;
    return schema.elements.get(localName);
}
export function extractNamespaceMap(xmlContent) {
    const map = new Map();
    const xmlnsRegex = /xmlns:?(\w*)\s*=\s*"([^"]+)"/g;
    let match;
    while ((match = xmlnsRegex.exec(xmlContent)) !== null) {
        const prefix = match[1] || "";
        const uri = match[2];
        map.set(prefix, uri);
    }
    return map;
}
//# sourceMappingURL=xsd-schema-loader.js.map