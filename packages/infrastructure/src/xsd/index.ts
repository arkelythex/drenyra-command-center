/**
 * XSD Validation Engine — Barrel Export
 *
 * Provides UBL 2.1 XSD schema parsing and validation infrastructure
 * for the CPE validator and other SUNAT compliance features.
 *
 * Usage:
 * ```ts
 * import { XsdValidator, XsdCache } from "@arkelythex/infrastructure/xsd";
 *
 * const validator = new XsdValidator("/path/to/xsd/ubl21");
 * validator.loadSchemas();
 * const result = validator.validate(xmlContent, "Invoice");
 * ```
 */

export { XsdValidator, validateUblDocument } from "./xsd-validator";
export type { XsdValidationResult, XsdValidationError } from "./types";
export { XSD_ERROR_CODES } from "./xsd-validator";

export { XsdSchemaLoader, extractNamespaceMap, resolvePrefixedElement } from "./xsd-schema-loader";
export type { DocumentType } from "./types";

export {
	XsdCache,
	getXsdCache,
	resetXsdCache,
	DEFAULT_XSD_DIR,
} from "./xsd-cache";

export {
	UBL_NAMESPACE_PREFIXES,
	UBL_DOCUMENT_NAMESPACES,
	XSD_FILE_NAMESPACE_MAP,
} from "./types";
export type {
	XsdSchema,
	XsdElementDef,
	XsdComplexType,
	XsdSimpleType,
	XsdAttributeDef,
	ResolvedElementRef,
} from "./types";
