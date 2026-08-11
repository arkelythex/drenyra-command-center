/**
 * XML Builder Helpers
 * Utility functions for UBL XML construction
 */

import type { XMLBuilder } from "xmlbuilder2/lib/interfaces";

/**
 * Format amount with 2 decimals.
 *
 * @param amount - Numeric amount
 * @returns Amount formatted with 2 decimals
 *
 * @example
 * ```ts
 * formatAmount(10); // "10.00"
 * ```
 */
export function formatAmount(amount: number): string {
	return amount.toFixed(2);
}

/**
 * Format date to `YYYY-MM-DD`.
 *
 * @param date - Date instance or ISO string
 * @returns Date string `YYYY-MM-DD`
 *
 * @example
 * ```ts
 * formatDate("2026-02-03T10:00:00Z"); // "2026-02-03"
 * ```
 */
export function formatDate(date: Date | string): string {
	if (typeof date === "string") {
		return date.split("T")[0] ?? ""; // Remove time if ISO string
	}
	return date.toISOString().split("T")[0] ?? "";
}

/**
 * Create XML element with namespace and optional text value.
 *
 * @param parent - Parent XMLBuilder node
 * @param namespace - Namespace prefix (e.g., `cbc`, `cac`)
 * @param tagName - Element tag name (without prefix)
 * @param value - Optional text value
 * @returns The created XMLBuilder element
 *
 * @example
 * ```ts
 * const doc = create().ele("Invoice");
 * createElement(doc, "cbc", "ID", "F001-00000001");
 * ```
 */
export function createElement(
	parent: XMLBuilder,
	namespace: string,
	tagName: string,
	value?: string | number,
): XMLBuilder {
	const element = parent.ele(`${namespace}:${tagName}`);
	if (value !== undefined) {
		element.txt(String(value));
	}
	return element;
}

/**
 * Create amount element with `currencyID` attribute and formatted value.
 *
 * @param parent - Parent XMLBuilder node
 * @param namespace - Namespace prefix (typically `cbc`)
 * @param tagName - Element tag name (without prefix)
 * @param amount - Numeric amount
 * @param currency - ISO 4217 code (e.g., `PEN`)
 * @returns The parent builder (after `.up()`)
 *
 * @example
 * ```ts
 * const doc = create().ele("Invoice");
 * createAmountElement(doc, "cbc", "PayableAmount", 118, "PEN");
 * ```
 */
export function createAmountElement(
	parent: XMLBuilder,
	namespace: string,
	tagName: string,
	amount: number,
	currency: string,
): XMLBuilder {
	return parent
		.ele(`${namespace}:${tagName}`)
		.att("currencyID", currency)
		.txt(formatAmount(amount))
		.up();
}

/**
 * Create a `cac:Party` element for supplier/customer.
 *
 * @param parent - Parent XMLBuilder node
 * @param namespace - Namespace prefix (`cac`)
 * @param party - Party data (RUC, legal name, optional address)
 * @returns The parent builder (after appending the party element)
 *
 * @example
 * ```ts
 * const doc = create().ele("Invoice");
 * createPartyElement(doc.ele("cac:AccountingSupplierParty"), "cac", {
 *   ruc: "20123456789",
 *   legalName: "ACME S.A.C.",
 *   address: { country: "PE" },
 * });
 * ```
 */
export function createPartyElement(
	parent: XMLBuilder,
	namespace: "cac",
	party: {
		ruc: string;
		documentType?: "1" | "6";
		legalName: string;
		tradeName?: string;
		address?: {
			streetName?: string;
			cityName?: string;
			district?: string;
			country: string;
		};
	},
): XMLBuilder {
	const partyElement = parent.ele(`${namespace}:Party`);
	const documentType = party.documentType ?? "6";

	// Party Identification
	partyElement
		.ele(`${namespace}:PartyIdentification`)
		.ele("cbc:ID")
		.att("schemeID", documentType) // 1 = DNI, 6 = RUC
		.att("schemeName", "Documento de Identidad")
		.att("schemeAgencyName", "PE:SUNAT")
		.att("schemeURI", "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06")
		.txt(party.ruc)
		.up()
		.up();

	// Party Name (Legal Name)
	partyElement
		.ele(`${namespace}:PartyName`)
		.ele("cbc:Name")
		.txt(party.legalName)
		.up()
		.up();

	// Party Legal Entity
	const legalEntity = partyElement.ele(`${namespace}:PartyLegalEntity`);
	legalEntity.ele("cbc:RegistrationName").txt(party.legalName).up();

	// Address (if provided)
	if (party.address) {
		const addressElement = legalEntity.ele(`${namespace}:RegistrationAddress`);

		if (party.address.streetName) {
			addressElement
				.ele("cbc:AddressLine")
				.ele("cbc:Line")
				.txt(party.address.streetName)
				.up()
				.up();
		}

		if (party.address.cityName) {
			addressElement.ele("cbc:CityName").txt(party.address.cityName).up();
		}

		if (party.address.district) {
			addressElement.ele("cbc:District").txt(party.address.district).up();
		}

		addressElement
			.ele("cbc:Country")
			.ele("cbc:IdentificationCode")
			.txt(party.address.country)
			.up()
			.up();

		addressElement.up(); // Close RegistrationAddress
	}

	legalEntity.up(); // Close PartyLegalEntity
	partyElement.up(); // Close Party

	return parent;
}

/**
 * Validate series format (SUNAT 2026)
 * Serie debe ser 4 caracteres, ejemplo: F001, B001
 *
 * @param series - Series string (e.g., `F001`)
 * @returns `true` if valid, otherwise `false`
 *
 * @example
 * ```ts
 * validateSeries("F001"); // true
 * ```
 */
export function validateSeries(series: string): boolean {
	return /^[A-Z0-9]{4}$/.test(series);
}

/**
 * Validate correlative format
 * Correlativo debe ser numérico, máximo 8 dígitos
 *
 * @param correlative - Correlative string (e.g., `00000001`)
 * @returns `true` if valid, otherwise `false`
 *
 * @example
 * ```ts
 * validateCorrelative("00000001"); // true
 * ```
 */
export function validateCorrelative(correlative: string): boolean {
	return /^\d{1,8}$/.test(correlative);
}

/**
 * Validate RUC format (11 digits)
 *
 * @param ruc - RUC string (11 digits)
 * @returns `true` if valid, otherwise `false`
 *
 * @example
 * ```ts
 * validateRuc("20123456789"); // true
 * ```
 */
export function validateRuc(ruc: string): boolean {
	return /^\d{11}$/.test(ruc);
}

/**
 * Validate SUNAT party identity document format.
 *
 * @param documentNumber - DNI or RUC number
 * @param documentType - Catalog 06 document type, 1=DNI and 6=RUC
 * @returns `true` if the number matches the document type format
 *
 * @example
 * ```ts
 * validatePartyDocument("12345678", "1"); // true
 * validatePartyDocument("20123456789", "6"); // true
 * ```
 */
export function validatePartyDocument(
	documentNumber: string,
	documentType: "1" | "6" = "6",
): boolean {
	if (documentType === "1") {
		return /^\d{8}$/.test(documentNumber);
	}

	return validateRuc(documentNumber);
}

/**
 * Parse invoice ID (F001-00000001 => {series, correlative})
 *
 * @param id - Invoice id in format `SERIE-CORRELATIVE`
 * @returns Parsed parts `{ series, correlative }`
 * @throws {Error} If the id, series or correlative format is invalid
 *
 * @example
 * ```ts
 * parseInvoiceId("F001-00000001"); // { series: "F001", correlative: "00000001" }
 * ```
 */
export function parseInvoiceId(id: string): {
	series: string;
	correlative: string;
} {
	const [series, correlative] = id.split("-");
	if (!series || !correlative) {
		throw new Error(
			`Invalid invoice ID format: ${id}. Expected: SERIE-CORRELATIVO`,
		);
	}
	if (!validateSeries(series)) {
		throw new Error(
			`Invalid series format: ${series}. Must be 4 alphanumeric characters.`,
		);
	}
	if (!validateCorrelative(correlative)) {
		throw new Error(
			`Invalid correlative format: ${correlative}. Must be numeric, max 8 digits.`,
		);
	}
	return { series, correlative };
}

/**
 * Generate file name for XML
 * Format: RUC-TipoDoc-Serie-Numero.xml
 *
 * @param ruc - Supplier RUC (11 digits)
 * @param docType - Document type code (e.g., `01`, `07`)
 * @param series - Series (e.g., `F001`)
 * @param correlative - Correlative (e.g., `00000001`)
 * @returns File name in SUNAT format
 *
 * @example
 * ```ts
 * generateXmlFileName("20123456789", "01", "F001", "00000001");
 * // "20123456789-01-F001-00000001.xml"
 * ```
 */
export function generateXmlFileName(
	ruc: string,
	docType: string,
	series: string,
	correlative: string,
): string {
	return `${ruc}-${docType}-${series}-${correlative}.xml`;
}
