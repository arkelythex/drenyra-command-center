/**
 * UBL 2.1 XML Validator Service
 * Validates CPE XML against OASIS UBL 2.1 schemas (offline)
 *
 * Production: XSD schema validation using custom UBL 2.1 XSD parser
 *
 * @see https://docs.oasis-open.org/ubl/UBL-2.1.html
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { ValidationError } from "../value-objects/validation-result.vo";
import { SunatStructuralRules2026Service } from "./sunat-structural-rules-2026.service";

// Dynamic import for XSD validator — graceful if xsd files aren't available
let XsdValidatorModule:
	| typeof import("@drenyra/infrastructure/xsd/xsd-validator")
	| null = null;

async function getXsdValidatorModule(): Promise<
	typeof import("@drenyra/infrastructure/xsd/xsd-validator") | null
> {
	if (!XsdValidatorModule) {
		try {
			XsdValidatorModule = await import(
				"@drenyra/infrastructure/xsd/xsd-validator"
			);
		} catch {
			// XSD module not available — validation will be skipped
		}
	}
	return XsdValidatorModule;
}

/**
 * Default XSD directory resolution.
 * Tries multiple locations for maximum compatibility.
 */
function resolveXsdDir(): string | null {
	const candidates = [
		// Adjacent to apps/api (dev)
		resolve(process.cwd(), "packages/infrastructure/src/xsd/ubl21"),
		// From infrastructure package (installed)
		resolve(
			process.cwd(),
			"node_modules/@drenyra/infrastructure/src/xsd/ubl21",
		),
		// Relative to this file
		resolve(
			import.meta.dirname ?? __dirname,
			"../../../../../../packages/infrastructure/src/xsd/ubl21",
		),
	];

	for (const dir of candidates) {
		if (existsSync(dir)) {
			return dir;
		}
	}

	return null;
}

/**
 * UblValidationResult interface.
 *
 * @example
 * ```ts
 * const value: UblValidationResult = {} as UblValidationResult;
 * console.log(value);
 * ```
 */
export interface UblValidationResult {
	isValid: boolean;
	errors: ValidationError[];
	warnings: string[];
	xsdValid?: boolean;
	xsdErrors?: Array<{ code: string; message: string; path: string }>;
}

/**
 * XmlDocument interface.
 *
 * @example
 * ```ts
 * const value: XmlDocument = {} as XmlDocument;
 * console.log(value);
 * ```
 */
export interface XmlDocument {
	content: string;
	encoding?: string;
}

/**
 * UBL Validator Service
 *
 * Production: Full XSD schema validation with custom UBL 2.1 XSD parser
 * (replaces the prior libxmljs2-xsd reference)
 *
 * @example
 * ```ts
 * const value = new UblValidatorService();
 * console.log(value);
 * ```
 */

export class UblValidatorService {
	private readonly sunatRules = new SunatStructuralRules2026Service();
	private xsdDir: string | null = null;

	constructor() {
		this.xsdDir = resolveXsdDir();
	}

	/**
	 * Validate UBL 2.1 XML document
	 *
	 * Production implementation: Well-formedness + XSD validation + structural checks
	 */
	async validate(xml: XmlDocument): Promise<UblValidationResult> {
		const errors: ValidationError[] = [];
		const warnings: string[] = [];
		let xsdValid: boolean | undefined;
		let xsdErrors:
			| Array<{ code: string; message: string; path: string }>
			| undefined;

		// 1. Check XML well-formedness
		if (!this.isWellFormed(xml.content)) {
			errors.push({
				code: "XML_MALFORMED",
				message: "XML document is not well-formed",
			});
			return { isValid: false, errors, warnings };
		}

		// 2. Check UBL 2.1 namespace
		if (!this.hasUblNamespace(xml.content)) {
			errors.push({
				code: "MISSING_UBL_NAMESPACE",
				message:
					'Missing UBL 2.1 namespace (xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2")',
			});
		}

		// 3. Check required elements (Invoice, ID, IssueDate, etc.)
		const missingElements = this.checkRequiredElements(xml.content);
		if (missingElements.length > 0) {
			errors.push({
				code: "MISSING_REQUIRED_ELEMENTS",
				message: `Missing required UBL elements: ${missingElements.join(", ")}`,
			});
		}

		// 4. XSD validation — when schema files are available
		if (this.xsdDir) {
			try {
				const xsdModule = await getXsdValidatorModule();
				if (xsdModule) {
					const docType = this.detectDocumentType(xml.content);
					const validator = new xsdModule.XsdValidator(this.xsdDir);
					validator.loadSchemas();

					if (validator.hasSchemas()) {
						const xsdResult = validator.validate(xml.content, docType);
						xsdValid = xsdResult.valid;

						if (xsdResult.errors.length > 0) {
							xsdErrors = xsdResult.errors.map((e) => ({
								code: e.code,
								message: e.message,
								path: e.path,
							}));
							errors.push(
								...xsdResult.errors.map(
									(e): ValidationError => ({
										code: e.code,
										message: `[XSD] ${e.message}`,
									}),
								),
							);
						}

						if (xsdResult.warnings.length > 0) {
							warnings.push(
								...xsdResult.warnings.map((w) => `[XSD] ${w.message}`),
							);
						}
					}
				}
			} catch (error) {
				// Graceful degradation: XSD validation failed but other checks continue
				warnings.push(
					`XSD validation unavailable: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		} else {
			warnings.push(
				"XSD schema files not found. Install XSD schemas at packages/infrastructure/src/xsd/ubl21/",
			);
		}

		// 5. Apply Drenyra structural baseline for SUNAT Feb 2026 rules
		const structuralValidation = this.sunatRules.validate(xml.content);
		errors.push(...structuralValidation.errors);
		warnings.push(...structuralValidation.warnings);

		// 6. Warnings for optional but recommended elements
		if (!xml.content.includes("<cbc:Note>")) {
			warnings.push("Missing <cbc:Note> element (recommended for clarity)");
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
			xsdValid,
			xsdErrors,
		};
	}

	/**
	 * Detect the document type from the XML root element.
	 */
	private detectDocumentType(content: string): "Invoice" | "CreditNote" {
		if (content.includes("<Invoice") || content.includes(":Invoice")) {
			return "Invoice";
		}
		if (content.includes("<CreditNote") || content.includes(":CreditNote")) {
			return "CreditNote";
		}
		return "Invoice"; // Default
	}

	private isWellFormed(xml: string): boolean {
		try {
			// Basic XML syntax check
			const hasOpeningTag = /<[^>]+>/.test(xml);
			const hasClosingTag = /<\/[^>]+>/.test(xml);
			const balanced = this.areTagsBalanced(xml);

			return hasOpeningTag && hasClosingTag && balanced;
		} catch {
			return false;
		}
	}

	private areTagsBalanced(xml: string): boolean {
		// Remove comments first
		const withoutComments = xml.replace(/<!--[\s\S]*?-->/g, "");

		// Count tags (excluding <?xml and <!DOCTYPE)
		const openTags = (
			withoutComments.match(/<(?!\?|!|\/)[^>]+(?<!\/|\\)>/g) || []
		).length;
		const closeTags = (withoutComments.match(/<\/[^>]+>/g) || []).length;
		const selfClosingTags = (withoutComments.match(/<[^>]+\/>/g) || []).length;

		return openTags === closeTags + selfClosingTags;
	}

	private hasUblNamespace(xml: string): boolean {
		return (
			xml.includes('xmlns="urn:oasis:names:specification:ubl:schema:xsd') ||
			xml.includes("xmlns:ubl=")
		);
	}

	private checkRequiredElements(xml: string): string[] {
		const required = [
			"<cbc:ID>",
			"<cbc:IssueDate>",
			"<cac:AccountingSupplierParty>",
			"<cac:AccountingCustomerParty>",
			"<cac:LegalMonetaryTotal>",
		];

		return required.filter((element) => !xml.includes(element));
	}
}
