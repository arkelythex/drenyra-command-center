/**
 * XSD Schema Model Types
 *
 * TypeScript representations of the XSD schema constructs
 * used in UBL 2.1 validation. Covers exactly the subset
 * that UBL 2.1 schemas use: complexType (sequence/choice/all),
 * simpleType (restriction), element declarations, attributes,
 * and cross-file import/include references.
 */

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

/**
 * Resolved reference after processing cross-file imports.
 */
export interface ResolvedElementRef {
	namespace: string;
	localName: string;
	prefix: string;
}

/**
 * Document type mapping to XSD schema root element.
 */
export type DocumentType = "Invoice" | "CreditNote";

/**
 * Namespace prefix mapping used in SUNAT UBL documents.
 */
export const UBL_NAMESPACE_PREFIXES = {
	cac: "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
	cbc: "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
	ext: "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",
	sac: "urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2",
	sbc: "urn:oasis:names:specification:ubl:schema:xsd:SignatureBasicComponents-2",
} as const;

/**
 * UBL 2.1 main document namespace mapping.
 */
export const UBL_DOCUMENT_NAMESPACES = {
	Invoice:
		"urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
	CreditNote:
		"urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2",
} as const;

/**
 * XSD file name to namespace mapping for loading.
 */
export const XSD_FILE_NAMESPACE_MAP: Record<string, string> = {
	"UBL-Invoice-2.1.xsd":
		"urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
	"UBL-CreditNote-2.1.xsd":
		"urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2",
	"UBL-CommonAggregateComponents-2.1.xsd":
		"urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
	"UBL-CommonBasicComponents-2.1.xsd":
		"urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
	"UBL-CommonExtensionComponents-2.1.xsd":
		"urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",
	"UBL-CommonSignatureComponents-2.1.xsd":
		"urn:oasis:names:specification:ubl:schema:xsd:CommonSignatureComponents-2",
	"UBL-SignatureAggregateComponents-2.1.xsd":
		"urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2",
	"UBL-SignatureBasicComponents-2.1.xsd":
		"urn:oasis:names:specification:ubl:schema:xsd:SignatureBasicComponents-2",
	"UBL-QualifiedDataTypes-2.1.xsd":
		"urn:oasis:names:specification:ubl:schema:xsd:QualifiedDataTypes-2",
	"UBL-UnqualifiedDataTypes-2.1.xsd":
		"urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2",
};
