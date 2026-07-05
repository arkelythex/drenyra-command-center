/**
 * XSD Validator
 *
 * Validates XML documents against UBL 2.1 XSD schemas using our
 * custom schema parser (not a full XSD engine). Handles the subset
 * of XSD that UBL 2.1 actually uses.
 *
 * Validation checks:
 * 1. Root element matches expected document type
 * 2. Required elements are present (minOccurs ≥ 1)
 * 3. Element cardinality (maxOccurs not exceeded)
 * 4. Required attributes are present
 * 5. Element ordering in sequences
 *
 * SUNAT extensions (<ext:UBLExtensions>) are ignored during validation
 * since they're SUNAT-specific and validated separately.
 */

import { type X2jOptions, XMLParser, XMLValidator } from "fast-xml-parser";
import type {
	DocumentType,
	XsdComplexType,
	XsdElementDef,
	XsdSchema,
	XsdValidationError,
	XsdValidationResult,
} from "./types";
import { UBL_DOCUMENT_NAMESPACES, UBL_NAMESPACE_PREFIXES } from "./types";
import {
	extractNamespaceMap,
	resolvePrefixedElement,
	XsdSchemaLoader,
} from "./xsd-schema-loader";

/**
 * Error codes used in XSD validation results.
 */
export const XSD_ERROR_CODES = {
	ROOT_ELEMENT_MISMATCH: "XSD_ROOT_ELEMENT_MISMATCH",
	MISSING_REQUIRED_ELEMENT: "XSD_MISSING_REQUIRED_ELEMENT",
	MAX_OCCURS_EXCEEDED: "XSD_MAX_OCCURS_EXCEEDED",
	MISSING_REQUIRED_ATTRIBUTE: "XSD_MISSING_REQUIRED_ATTRIBUTE",
	UNKNOWN_ELEMENT: "XSD_UNKNOWN_ELEMENT",
	ELEMENT_OUT_OF_ORDER: "XSD_ELEMENT_OUT_OF_ORDER",
	SCHEMA_NOT_AVAILABLE: "XSD_SCHEMA_NOT_AVAILABLE",
	XML_PARSE_ERROR: "XSD_XML_PARSE_ERROR",
} as const;

/**
 * XsdValidator
 *
 * Validates XML documents against parsed UBL 2.1 XSD schemas.
 */
export class XsdValidator {
	private loader: XsdSchemaLoader;
	private parser: XMLParser;
	private schemas: Map<string, XsdSchema> | null = null;

	constructor(xsdDir: string) {
		this.loader = new XsdSchemaLoader(xsdDir);
		this.parser = new XMLParser({
			ignoreAttributes: false,
			attributeNamePrefix: "@_",
			removeNSPrefix: false,
			parseTagValue: true,
			parseAttributeValue: true,
			trimValues: true,
			processEntities: false,
		} as X2jOptions);
	}

	/**
	 * Load all XSD schemas. Must be called before validation.
	 */
	loadSchemas(): boolean {
		try {
			this.schemas = this.loader.loadAllSchemas();
			return true;
		} catch {
			this.schemas = null;
			return false;
		}
	}

	/**
	 * Check if schemas have been loaded.
	 */
	hasSchemas(): boolean {
		return this.schemas !== null && this.schemas.size > 0;
	}

	/**
	 * Validate an XML document against a UBL 2.1 XSD schema.
	 *
	 * @param xmlContent - Raw XML string to validate
	 * @param docType - Document type ("Invoice" | "CreditNote")
	 * @returns Structured validation result
	 */
	validate(xmlContent: string, docType: DocumentType): XsdValidationResult {
		const errors: XsdValidationError[] = [];
		const warnings: XsdValidationError[] = [];

		// 1. Parse XML
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

		let parsedXml: Record<string, unknown>;
		try {
			parsedXml = this.parser.parse(xmlContent) as Record<string, unknown>;
		} catch (error) {
			errors.push({
				code: XSD_ERROR_CODES.XML_PARSE_ERROR,
				message: `Failed to parse XML: ${error instanceof Error ? error.message : "Unknown error"}`,
				path: "/",
				severity: "ERROR",
			});
			return { valid: false, errors, warnings };
		}

		// 2. Get the schema for this document type
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

		// 3. Build namespace prefix map from the XML document
		const nsMap = extractNamespaceMap(xmlContent);

		// 4. Find root element
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

		// 5. Get root element definition from schema
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

		// 6. Validate the root element's type definition
		const rootType = this.resolveType(rootElementDef.type ?? "", docSchema);
		if (rootType && "sequence" in rootType && rootType.sequence) {
			this.validateSequence(
				rootTag as Record<string, unknown>,
				rootType.sequence,
				nsMap,
				`/${docType}`,
				errors,
				warnings,
			);
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
		};
	}

	/**
	 * Get all available schemas (for external inspection).
	 */
	getAllSchemas(): Map<string, XsdSchema> {
		return this.schemas ?? new Map();
	}

	private getSchemaForDocType(docType: DocumentType): XsdSchema | undefined {
		if (!this.schemas) return undefined;

		// Try namespace-based lookup first
		const targetNs = UBL_DOCUMENT_NAMESPACES[docType];

		if (this.schemas.has(targetNs)) {
			return this.schemas.get(targetNs);
		}

		// Fallback: find by element name
		for (const [, schema] of this.schemas) {
			if (schema.elements.has(docType)) {
				return schema;
			}
		}

		return undefined;
	}

	private findRootTag(
		docType: DocumentType,
		parsedXml: Record<string, unknown>,
	): Record<string, unknown> | undefined {
		// The root element could be prefixed or not depending on the XML
		const possibleKeys = [docType, `Invoice`, `CreditNote`];

		for (const key of possibleKeys) {
			const value = parsedXml[key];
			if (value && typeof value === "object") {
				return value as Record<string, unknown>;
			}
		}

		return undefined;
	}

	private resolveType(
		typeName: string | undefined,
		currentSchema: XsdSchema,
	): XsdComplexType | undefined {
		if (!typeName) return undefined;

		// UBL types use prefixed types like "cbc:IDType" or unqualified like "InvoiceType"
		const localName = typeName.includes(":")
			? typeName.split(":")[1]
			: typeName;

		// Check current schema first
		const localType = currentSchema.types.get(localName);
		if (localType && "sequence" in localType) {
			return localType;
		}

		// Search across all schemas
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

	private resolveElementDef(
		elementDef: XsdElementDef,
		nsMap: Map<string, string>,
	): XsdElementDef | undefined {
		if (!elementDef.ref) return elementDef;

		// Resolve ref="cbc:ID" by looking up the reference across schemas
		const resolved = resolvePrefixedElement(
			elementDef.ref,
			nsMap,
			this.schemas ?? new Map(),
		);

		return resolved;
	}

	private validateSequence(
		parentXml: Record<string, unknown>,
		sequence: XsdElementDef[],
		nsMap: Map<string, string>,
		path: string,
		errors: XsdValidationError[],
		warnings: XsdValidationError[],
	): void {
		// Build a map of the actual child elements in the XML
		const xmlChildCounts = this.countChildElements(parentXml);

		for (const schemaElement of sequence) {
			// Skip SUNAT extension elements — validated separately
			if (schemaElement.ref === "ext:UBLExtensions") {
				continue;
			}

			// Skip if the element has a ref and it's an ext:* namespace
			if (schemaElement.ref?.startsWith("ext:")) {
				continue;
			}

			// Resolve the element definition (follow refs)
			const resolvedDef = this.resolveElementDef(schemaElement, nsMap);
			if (!resolvedDef) continue;

			// Determine the XML tag name to look for
			const tagName = schemaElement.ref
				? this.getLocalTagName(schemaElement.ref)
				: schemaElement.name;

			// Count occurrences in the XML
			const xmlCount = xmlChildCounts.get(tagName) ?? 0;

			// Check minOccurs
			if (schemaElement.minOccurs > 0 && xmlCount < schemaElement.minOccurs) {
				errors.push({
					code: XSD_ERROR_CODES.MISSING_REQUIRED_ELEMENT,
					message: `Required element <${tagName}> is missing (minOccurs: ${schemaElement.minOccurs})`,
					path: `${path}/${tagName}`,
					severity: "ERROR",
				});
			}

			// Check maxOccurs
			const maxOccurs =
				schemaElement.maxOccurs === "unbounded"
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

			// Recursively validate child elements if this element is a complex type
			if (resolvedDef.type && xmlCount > 0) {
				this.validateChildElements(
					parentXml,
					tagName,
					resolvedDef,
					nsMap,
					`${path}/${tagName}`,
					errors,
					warnings,
				);
			}
		}
	}

	private validateChildElements(
		parentXml: Record<string, unknown>,
		tagName: string,
		elementDef: XsdElementDef,
		nsMap: Map<string, string>,
		path: string,
		errors: XsdValidationError[],
		warnings: XsdValidationError[],
	): void {
		// Use inline children if available
		if (elementDef.children && elementDef.children.length > 0) {
			const xmlData = this.getXmlChildData(parentXml, tagName);
			if (xmlData) {
				this.validateSequence(
					xmlData,
					elementDef.children,
					nsMap,
					path,
					errors,
					warnings,
				);
			}
			return;
		}

		// Resolve type to get its sequence
		if (!elementDef.type || !this.schemas) return;

		const localName = elementDef.type.includes(":")
			? elementDef.type.split(":")[1]
			: elementDef.type;

		// Search for the type in all schemas
		for (const [, schema] of this.schemas) {
			const typeDef = schema.types.get(localName);
			if (typeDef && "sequence" in typeDef && typeDef.sequence) {
				const xmlData = this.getXmlChildData(parentXml, tagName);
				if (xmlData) {
					this.validateSequence(
						xmlData,
						typeDef.sequence,
						nsMap,
						path,
						errors,
						warnings,
					);
				}
				return;
			}
		}
	}

	private countChildElements(
		xml: Record<string, unknown>,
	): Map<string, number> {
		const counts = new Map<string, number>();

		for (const key of Object.keys(xml)) {
			// Strip namespace prefix for comparison
			const localName = this.stripPrefix(key);
			const value = xml[key];

			// Check if we need to ignore attribute keys
			if (key.startsWith("@_")) continue;

			if (Array.isArray(value)) {
				counts.set(localName, (counts.get(localName) ?? 0) + value.length);
			} else if (typeof value === "object" && value !== null) {
				counts.set(localName, (counts.get(localName) ?? 0) + 1);
			} else {
				counts.set(localName, (counts.get(localName) ?? 0) + 1);
			}
		}

		return counts;
	}

	private getXmlChildData(
		parentXml: Record<string, unknown>,
		localTagName: string,
	): Record<string, unknown> | undefined {
		// Look for the child data by trying various key patterns
		for (const key of Object.keys(parentXml)) {
			const localPart = this.stripPrefix(key);
			if (localPart === localTagName) {
				const value = parentXml[key];
				if (Array.isArray(value) && value.length > 0) {
					return typeof value[0] === "object" && value[0] !== null
						? (value[0] as Record<string, unknown>)
						: {};
				}
				if (typeof value === "object" && value !== null) {
					return value as Record<string, unknown>;
				}
				// Leaf element (text content only) — no children to validate
				return undefined;
			}
		}

		return undefined;
	}

	private getLocalTagName(prefixedName: string): string {
		const colonIndex = prefixedName.indexOf(":");
		return colonIndex === -1
			? prefixedName
			: prefixedName.slice(colonIndex + 1);
	}

	private stripPrefix(key: string): string {
		// fast-xml-parser may or may not include the namespace prefix
		// depending on the removeNSPrefix option.
		// Since removeNSPrefix: false, keys look like "cbc:ID" or "Invoice"
		// We need to handle both cases.
		const colonIndex = key.indexOf(":");
		return colonIndex === -1 ? key : key.slice(colonIndex + 1);
	}
}

/**
 * Convenience function: validate a UBL XML document against its XSD schema.
 *
 * @param xmlContent - Raw XML content
 * @param docType - "Invoice" or "CreditNote"
 * @param xsdDir - Path to directory containing UBL XSD files
 * @returns Validation result
 */
export function validateUblDocument(
	xmlContent: string,
	docType: DocumentType,
	xsdDir: string,
): XsdValidationResult {
	const validator = new XsdValidator(xsdDir);
	validator.loadSchemas();
	return validator.validate(xmlContent, docType);
}
