/**
 * XSD Schema Loader
 *
 * Parses UBL 2.1 XSD schema files using fast-xml-parser and builds
 * a resolved XsdSchemaGraph with cross-file references resolved.
 *
 * Handles:
 * - xsd:import / xsd:include for cross-schema references
 * - targetNamespace, elementFormDefault resolution
 * - xsd:element, xsd:complexType, xsd:simpleType parsing
 * - xsd:sequence, xsd:choice, xsd:all within complex types
 * - xsd:attribute on elements and complex types
 * - minOccurs/maxOccurs with default values
 * - ref="cbc:ID" resolution across namespace boundaries
 */

import { XMLParser, type X2jOptions } from "fast-xml-parser";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import type {
	XsdSchema,
	XsdElementDef,
	XsdComplexType,
	XsdSimpleType,
	XsdAttributeDef,
	DocumentType,
} from "./types";
import { XSD_FILE_NAMESPACE_MAP, UBL_DOCUMENT_NAMESPACES } from "./types";

/**
 * Raw parsed XSD file structure before type conversion.
 * Matches fast-xml-parser output with attribute prefix "@_".
 */
interface RawXsdRoot {
	"xsd:schema"?: RawXsdSchema;
	"xs:schema"?: RawXsdSchema;
}

interface RawXsdSchema {
	"@_targetNamespace"?: string;
	"@_elementFormDefault"?: string;
	"@_attributeFormDefault"?: string;
	"@_xmlns:xsd"?: string;
	"xsd:import"?: RawXsdImport | RawXsdImport[];
	"xs:import"?: RawXsdImport | RawXsdImport[];
	"xsd:include"?: RawXsdInclude | RawXsdInclude[];
	"xs:include"?: RawXsdInclude | RawXsdInclude[];
	"xsd:element"?: RawXsdElement | RawXsdElement[];
	"xs:element"?: RawXsdElement | RawXsdElement[];
	"xsd:complexType"?: RawXsdComplexType | RawXsdComplexType[];
	"xs:complexType"?: RawXsdComplexType | RawXsdComplexType[];
	"xsd:simpleType"?: RawXsdSimpleType | RawXsdSimpleType[];
	"xs:simpleType"?: RawXsdSimpleType | RawXsdSimpleType[];
}

interface RawXsdImport {
	"@_namespace": string;
	"@_schemaLocation"?: string;
}

interface RawXsdInclude {
	"@_schemaLocation": string;
}

interface RawXsdElement {
	"@_name"?: string;
	"@_type"?: string;
	"@_ref"?: string;
	"@_minOccurs"?: string;
	"@_maxOccurs"?: string;
	"@_nillable"?: string;
	"xsd:complexType"?: RawXsdComplexType;
	"xs:complexType"?: RawXsdComplexType;
	"xsd:simpleType"?: RawXsdSimpleType;
	"xs:simpleType"?: RawXsdSimpleType;
	"xsd:annotation"?: unknown;
	"xs:annotation"?: unknown;
}

interface RawXsdComplexType {
	"@_name"?: string;
	"@_mixed"?: string;
	"xsd:sequence"?: RawXsdSequence;
	"xs:sequence"?: RawXsdSequence;
	"xsd:choice"?: RawXsdChoice;
	"xs:choice"?: RawXsdChoice;
	"xsd:all"?: RawXsdAll;
	"xs:all"?: RawXsdAll;
	"xsd:simpleContent"?: RawXsdSimpleContent;
	"xs:simpleContent"?: RawXsdSimpleContent;
	"xsd:attribute"?: RawXsdAttribute | RawXsdAttribute[];
	"xs:attribute"?: RawXsdAttribute | RawXsdAttribute[];
	"xsd:annotation"?: unknown;
	"xs:annotation"?: unknown;
}

interface RawXsdSimpleContent {
	"xsd:extension"?: { "@_base"?: string };
	"xs:extension"?: { "@_base"?: string };
}

interface RawXsdSequence {
	"xsd:element"?: RawXsdElement | RawXsdElement[];
	"xs:element"?: RawXsdElement | RawXsdElement[];
	"xsd:choice"?: RawXsdChoice;
	"xs:choice"?: RawXsdChoice;
}

interface RawXsdChoice {
	"@_minOccurs"?: string;
	"@_maxOccurs"?: string;
	"xsd:element"?: RawXsdElement | RawXsdElement[];
	"xs:element"?: RawXsdElement | RawXsdElement[];
}

interface RawXsdAll {
	"xsd:element"?: RawXsdElement | RawXsdElement[];
	"xs:element"?: RawXsdElement | RawXsdElement[];
}

interface RawXsdAttribute {
	"@_name"?: string;
	"@_type"?: string;
	"@_use"?: string;
	"@_ref"?: string;
}

interface RawXsdSimpleType {
	"@_name"?: string;
	"xsd:restriction"?: RawXsdRestriction;
	"xs:restriction"?: RawXsdRestriction;
}

interface RawXsdRestriction {
	"@_base": string;
	"xsd:enumeration"?: RawXsdEnumeration | RawXsdEnumeration[];
	"xs:enumeration"?: RawXsdEnumeration | RawXsdEnumeration[];
}

interface RawXsdEnumeration {
	"@_value": string;
}

/**
 * XsdSchemaLoader
 *
 * Parses XSD files and produces resolved XsdSchema objects.
 * Handles the full cross-file reference graph between UBL 2.1 schema files.
 */
export class XsdSchemaLoader {
	private parser: XMLParser;
	private xsdDir: string;
	private loadedFiles = new Map<string, RawXsdSchema>();
	private parsedSchemas = new Map<string, XsdSchema>();

	constructor(xsdDir: string) {
		this.xsdDir = xsdDir;
		this.parser = new XMLParser({
			ignoreAttributes: false,
			attributeNamePrefix: "@_",
			removeNSPrefix: false,
			parseTagValue: false,
			parseAttributeValue: false,
			trimValues: true,
			processEntities: false,
		} as X2jOptions);
	}

	/**
	 * Load and parse a single XSD file (and its imports recursively).
	 */
	loadSchemaFile(fileName: string): XsdSchema {
		const cacheKey = fileName;

		if (this.parsedSchemas.has(cacheKey)) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			return this.parsedSchemas.get(cacheKey)!;
		}

		const filePath = resolve(this.xsdDir, fileName);

		if (!existsSync(filePath)) {
			throw new Error(`XSD file not found: ${filePath}`);
		}

		const xmlContent = readFileSync(filePath, "utf-8");
		const parsed = this.parser.parse(xmlContent) as RawXsdRoot;

		const schemaNode = parsed["xsd:schema"] ?? parsed["xs:schema"];

		if (!schemaNode) {
			throw new Error(
				`No xsd:schema root element found in ${fileName}`,
			);
		}

		// Process imports first
		const imports = this.normalizeArray(schemaNode["xsd:import"] ?? schemaNode["xs:import"]);

		for (const imp of imports) {
			if (imp["@_schemaLocation"]) {
				// The schemaLocation references are relative paths like "../common/UBL-Foo.xsd"
				// Normalize to just the filename since all UBL files are in the same directory
				const importedFile = imp["@_schemaLocation"].split("/").pop();
				if (importedFile && importedFile.endsWith(".xsd")) {
					// Check if this imported file exists in our directory
					const importPath = resolve(this.xsdDir, importedFile);
					if (existsSync(importPath)) {
						// Recursively load (but don't merge into this schema — just ensure it's cached)
						this.loadSchemaFile(importedFile);
					}
				}
			}
		}

		// Process includes
		const includes = this.normalizeArray(
			schemaNode["xsd:include"] ?? schemaNode["xs:include"],
		);

		for (const inc of includes) {
			if (inc["@_schemaLocation"]) {
				const includedFile = inc["@_schemaLocation"].split("/").pop();
				if (includedFile && includedFile.endsWith(".xsd")) {
					const includePath = resolve(this.xsdDir, includedFile);
					if (existsSync(includePath)) {
						this.loadSchemaFile(includedFile);
					}
				}
			}
		}

		// Build the schema
		const schema = this.buildSchema(schemaNode, fileName);
		this.parsedSchemas.set(cacheKey, schema);

		return schema;
	}

	/**
	 * Load all UBL XSD files in the directory.
	 */
	loadAllSchemas(): Map<string, XsdSchema> {
		const schemas = new Map<string, XsdSchema>();

		for (const fileName of Object.keys(XSD_FILE_NAMESPACE_MAP)) {
			try {
				const schema = this.loadSchemaFile(fileName);
				schemas.set(schema.targetNamespace, schema);
			} catch {
				// Skip files that don't exist or fail to parse
				// (some optional UBL files may not be present)
			}
		}

		return schemas;
	}

	/**
	 * Get schema for a specific document type.
	 */
	getSchemaForDocumentType(
		docType: DocumentType,
		allSchemas: Map<string, XsdSchema>,
	): XsdSchema | undefined {
		const targetNs = UBL_DOCUMENT_NAMESPACES[docType];

		if (allSchemas.has(targetNs)) {
			return allSchemas.get(targetNs);
		}

		// Fallback: find by filename pattern
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

	/**
	 * Clear all cached schemas.
	 */
	clearCache(): void {
		this.loadedFiles.clear();
		this.parsedSchemas.clear();
	}

	private buildSchema(
		raw: RawXsdSchema,
		fileName: string,
	): XsdSchema {
		const schema: XsdSchema = {
			targetNamespace:
				raw["@_targetNamespace"] ?? "",
			elementFormDefault:
				(raw["@_elementFormDefault"] as "qualified" | "unqualified") ??
				"unqualified",
			attributeFormDefault:
				(raw["@_attributeFormDefault"] as "qualified" | "unqualified") ??
				"unqualified",
			elements: new Map(),
			types: new Map(),
		};

		// Parse top-level element declarations
		const rawElements = this.normalizeArray(
			raw["xsd:element"] ?? raw["xs:element"] ?? [],
		);

		for (const rawEl of rawElements) {
			const element = this.parseRawElement(rawEl);
			if (element.name) {
				schema.elements.set(element.name, element);
			}
		}

		// Parse complexType definitions
		const rawComplexTypes = this.normalizeArray(
			raw["xsd:complexType"] ?? raw["xs:complexType"] ?? [],
		);

		for (const rawCt of rawComplexTypes) {
			if (rawCt["@_name"]) {
				const complexType = this.parseRawComplexType(rawCt);
				schema.types.set(complexType.name, complexType);
			}
		}

		// Parse simpleType definitions
		const rawSimpleTypes = this.normalizeArray(
			raw["xsd:simpleType"] ?? raw["xs:simpleType"] ?? [],
		);

		for (const rawSt of rawSimpleTypes) {
			if (rawSt["@_name"]) {
				const simpleType = this.parseRawSimpleType(rawSt);
				schema.types.set(simpleType.name, simpleType);
			}
		}

		return schema;
	}

	private parseRawElement(raw: RawXsdElement): XsdElementDef {
		const element: XsdElementDef = {
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

		// Inline complexType
		const inlineCt =
			raw["xsd:complexType"] ?? raw["xs:complexType"];
		if (inlineCt) {
			const parsed = this.parseRawComplexType(inlineCt);
			element.children = parsed.sequence ?? parsed.choice ?? parsed.all;
			element.attributes = parsed.attributes;
		}

		// Inline simpleType
		const inlineSt =
			raw["xsd:simpleType"] ?? raw["xs:simpleType"];

		return element;
	}

	private parseRawComplexType(raw: RawXsdComplexType): XsdComplexType {
		const ct: XsdComplexType = {
			name: raw["@_name"] ?? "",
			mixed: raw["@_mixed"] === "true",
		};

		// Handle simpleContent extension (common in UBL Basic Components)
		const simpleContent =
			raw["xsd:simpleContent"] ?? raw["xs:simpleContent"];
		if (simpleContent) {
			const extension =
				simpleContent["xsd:extension"] ??
				simpleContent["xs:extension"];
			if (extension?.["@_base"]) {
				ct.name = raw["@_name"] ?? extension["@_base"];
			}
			// Simple content types have no child elements in sequence
			return ct;
		}

		// Parse sequence
		const sequence =
			raw["xsd:sequence"] ?? raw["xs:sequence"];
		if (sequence) {
			ct.sequence = this.parseSequenceElements(sequence);
		}

		// Parse choice
		const choice = raw["xsd:choice"] ?? raw["xs:choice"];
		if (choice) {
			ct.choice = this.parseChoiceElements(choice);
		}

		// Parse all
		const all = raw["xsd:all"] ?? raw["xs:all"];
		if (all) {
			ct.all = this.parseAllElements(all);
		}

		// Parse attributes
		const rawAttrs = this.normalizeArray(
			raw["xsd:attribute"] ?? raw["xs:attribute"] ?? [],
		);
		if (rawAttrs.length > 0) {
			ct.attributes = rawAttrs.map((a) => this.parseRawAttribute(a));
		}

		return ct;
	}

	private parseRawSimpleType(raw: RawXsdSimpleType): XsdSimpleType {
		const st: XsdSimpleType = {
			name: raw["@_name"] ?? "",
		};

		const restriction = raw["xsd:restriction"] ?? raw["xs:restriction"];
		if (restriction) {
			const enums = this.normalizeArray(
				restriction["xsd:enumeration"] ?? restriction["xs:enumeration"] ?? [],
			);
			st.restriction = {
				base: restriction["@_base"],
				enumerations: enums.map((e) => e["@_value"]),
			};
		}

		return st;
	}

	private parseRawAttribute(raw: RawXsdAttribute): XsdAttributeDef {
		return {
			name: raw["@_name"] ?? raw["@_ref"] ?? "",
			type: raw["@_type"],
			use: (raw["@_use"] as "required" | "optional" | "prohibited") ??
				"optional",
		};
	}

	private parseSequenceElements(
		sequence: RawXsdSequence,
	): XsdElementDef[] {
		const elements: XsdElementDef[] = [];
		const rawElements = this.normalizeArray(
			sequence["xsd:element"] ?? sequence["xs:element"] ?? [],
		);

		for (const raw of rawElements) {
			elements.push(this.parseRawElement(raw));
		}

		// Handle nested choice inside sequence
		const nestedChoice =
			sequence["xsd:choice"] ?? sequence["xs:choice"];
		if (nestedChoice && !rawElements.length) {
			const choiceElements = this.parseChoiceElements(nestedChoice);
			elements.push(...choiceElements);
		}

		return elements;
	}

	private parseChoiceElements(choice: RawXsdChoice): XsdElementDef[] {
		const elements: XsdElementDef[] = [];
		const rawElements = this.normalizeArray(
			choice["xsd:element"] ?? choice["xs:element"] ?? [],
		);

		for (const raw of rawElements) {
			elements.push(this.parseRawElement(raw));
		}

		return elements;
	}

	private parseAllElements(all: RawXsdAll): XsdElementDef[] {
		const elements: XsdElementDef[] = [];
		const rawElements = this.normalizeArray(
			all["xsd:element"] ?? all["xs:element"] ?? [],
		);

		for (const raw of rawElements) {
			elements.push(this.parseRawElement(raw));
		}

		return elements;
	}

	/**
	 * Normalize a value that could be a single item or array into an array.
	 */
	private normalizeArray<T>(value: T | T[] | undefined | null): T[] {
		if (value == null) return [];
		return Array.isArray(value) ? value : [value];
	}
}

/**
 * Resolve a prefixed element reference (e.g. "cbc:ID") into its schema
 * by looking up the prefix in the document's namespace declarations.
 */
export function resolvePrefixedElement(
	prefixedName: string,
	docNs: Map<string, string>,
	allSchemas: Map<string, XsdSchema>,
): XsdElementDef | undefined {
	const colonIndex = prefixedName.indexOf(":");
	if (colonIndex === -1) {
		// No prefix — look in the default namespace schemas
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

	if (!ns) return undefined;

	const schema = allSchemas.get(ns);

	if (!schema) return undefined;

	return schema.elements.get(localName);
}

/**
 * Build a prefix-to-namespace map from an XML document string
 * by extracting xmlns:* declarations.
 */
export function extractNamespaceMap(
	xmlContent: string,
): Map<string, string> {
	const map = new Map<string, string>();
	// Match xmlns:prefix="uri" and xmlns="uri" (default)
	const xmlnsRegex = /xmlns:?(\w*)\s*=\s*"([^"]+)"/g;
	let match: RegExpExecArray | null;

	while ((match = xmlnsRegex.exec(xmlContent)) !== null) {
		const prefix = match[1] || "";
		const uri = match[2];
		map.set(prefix, uri);
	}

	return map;
}
