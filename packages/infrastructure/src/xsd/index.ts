/**
 * XSD Validation Engine — Barrel Export
 *
 * Provides UBL 2.1 XSD schema parsing and validation infrastructure
 * for the CPE validator and other SUNAT compliance features.
 *
 * Usage:
 * ```ts
 * import { XsdValidator, XsdCache } from "@drenyra/infrastructure/xsd";
 *
 * const validator = new XsdValidator("/path/to/xsd/ubl21");
 * validator.loadSchemas();
 * const result = validator.validate(xmlContent, "Invoice");
 * ```
 */

export type {
	DocumentType,
	ResolvedElementRef,
	XsdAttributeDef,
	XsdComplexType,
	XsdElementDef,
	XsdSchema,
	XsdSimpleType,
	XsdValidationError,
	XsdValidationResult,
} from "./types";
export {
	UBL_DOCUMENT_NAMESPACES,
	UBL_NAMESPACE_PREFIXES,
	XSD_FILE_NAMESPACE_MAP,
} from "./types";
export {
	DEFAULT_XSD_DIR,
	getXsdCache,
	resetXsdCache,
	XsdCache,
} from "./xsd-cache";
export {
	extractNamespaceMap,
	resolvePrefixedElement,
	XsdSchemaLoader,
} from "./xsd-schema-loader";
export {
	validateUblDocument,
	XSD_ERROR_CODES,
	XsdValidator,
} from "./xsd-validator";
