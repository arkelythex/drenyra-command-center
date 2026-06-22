/**
 * DocumentSeries Value Object.
 *
 * @description Represents the alphanumeric series prefix of a Peruvian
 * Electronic Document (CPE). It enforces strict SUNAT formatting rules to
 * differentiate between document types (Factura, Boleta, Notas).
 *
 * @rules
 * - Format: [Letter][Number of digits]
 * - F: Factura (Standard Series, 3 digits) - e.g., F001
 * - B: Boleta (Standard Series, 3 digits) - e.g., B001
 * - FC/BC: Nota de Crédito (2 digits) - e.g., FC01
 * - FD/BD: Nota de Débito (2 digits) - e.g., FD01
 *
 * @example
 * ```typescript
 * const series = DocumentSeries.create("F001");
 * console.info(series.isFactura()); // true
 * console.info(series.getDocumentType()); // "FACTURA"
 * ```
 *
 * @domain Value Object
 * @immutable
 * @since 1.0.0
 */

import { InvalidDocumentSeriesError } from "../errors/InvalidDocumentSeriesError";

/**
 * Supported SUNAT document types inferred from the series.
 *
 * @example
 * ```ts
 * const t: DocumentType = "FACTURA";
 * ```
 */
export type DocumentType =
	| "FACTURA"
	| "BOLETA"
	| "NOTA_CREDITO_FACTURA"
	| "NOTA_CREDITO_BOLETA"
	| "NOTA_DEBITO_FACTURA"
	| "NOTA_DEBITO_BOLETA";

/**
 * Document series value object (e.g., `F001`, `B001`, `FC01`).
 *
 * @throws {InvalidDocumentSeriesError} When the series format is invalid
 *
 * @example
 * ```ts
 * const series = DocumentSeries.create("F001");
 * series.isFactura(); // true
 * ```
 */
export class DocumentSeries {
	private constructor(
		private readonly value: string,
		private readonly documentType: DocumentType,
	) {
		Object.freeze(this);
	}

	/**
	 * Create a DocumentSeries
	 * @param value - Series string (e.g., "F001", "B002")
	 */
	static create(value: string): DocumentSeries {
		const trimmed = value.trim().toUpperCase();

		if (!DocumentSeries.isValid(trimmed)) {
			throw new InvalidDocumentSeriesError(value);
		}

		const documentType = DocumentSeries.detectDocumentType(trimmed);
		return new DocumentSeries(trimmed, documentType);
	}

	/**
	 * Validate series format
	 */
	private static isValid(series: string): boolean {
		// Valid formats: F001, B001 (factura/boleta with 3 digits)
		// FC01, BC01, FD01, BD01 (credit/debit notes with 2 digits)
		const pattern = /^(F\d{3}|B\d{3}|FC\d{2}|BC\d{2}|FD\d{2}|BD\d{2})$/;
		return pattern.test(series);
	}

	/**
	 * Detect document type from series prefix
	 */
	private static detectDocumentType(series: string): DocumentType {
		if (series.startsWith("FC")) return "NOTA_CREDITO_FACTURA";
		if (series.startsWith("BC")) return "NOTA_CREDITO_BOLETA";
		if (series.startsWith("FD")) return "NOTA_DEBITO_FACTURA";
		if (series.startsWith("BD")) return "NOTA_DEBITO_BOLETA";
		if (series.startsWith("F")) return "FACTURA";
		if (series.startsWith("B")) return "BOLETA";

		throw new InvalidDocumentSeriesError(series);
	}

	/**
	 * Get the series value
	 */
	toString(): string {
		return this.value;
	}

	/**
	 * Get the document type
	 */
	getDocumentType(): DocumentType {
		return this.documentType;
	}

	/**
	 * Check if this is a Factura series
	 */
	isFactura(): boolean {
		return this.documentType === "FACTURA";
	}

	/**
	 * Check if this is a Boleta series
	 */
	isBoleta(): boolean {
		return this.documentType === "BOLETA";
	}

	/**
	 * Check if this is a credit note
	 */
	isCreditNote(): boolean {
		return (
			this.documentType === "NOTA_CREDITO_FACTURA" ||
			this.documentType === "NOTA_CREDITO_BOLETA"
		);
	}

	/**
	 * Check if this is a debit note
	 */
	isDebitNote(): boolean {
		return (
			this.documentType === "NOTA_DEBITO_FACTURA" ||
			this.documentType === "NOTA_DEBITO_BOLETA"
		);
	}

	/**
	 * Get the numeric part of the series
	 */
	getNumericPart(): number {
		const match = this.value.match(/\d+$/);
		return match ? Number.parseInt(match[0], 10) : 0;
	}

	/**
	 * Get the letter prefix
	 */
	getPrefix(): string {
		return this.value.replace(/\d+$/, "");
	}

	/**
	 * Check equality
	 */
	equals(other: DocumentSeries | null | undefined): boolean {
		if (!other) {
			return false;
		}
		return this.value === other.value;
	}

	/**
	 * Serialize to JSON
	 */
	toJSON(): { value: string; documentType: DocumentType } {
		return {
			value: this.value,
			documentType: this.documentType,
		};
	}

	/**
	 * Deserialize from JSON
	 */
	static fromJSON(json: { value: string }): DocumentSeries {
		return DocumentSeries.create(json.value);
	}
}
