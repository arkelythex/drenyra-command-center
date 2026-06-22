/**
 * CPE Number Value Object
 * Format: [Serie]-[Número] (e.g., F001-00001234, B002-00005678)
 *
 * Series:
 * - F: Factura (Invoice)
 * - B: Boleta (Receipt)
 * - NC: Nota de Crédito (Credit Note)
 * - ND: Nota de Débito (Debit Note)
 * @example
 * ```ts
 * const value: CpeType = {} as CpeType;
 * console.log(value);
 * ```
 */

export type CpeType = "FACTURA" | "BOLETA" | "NOTA_CREDITO" | "NOTA_DEBITO";

/**
 * CpeNumber class.
 *
 * @example
 * ```ts
 * const value = new CpeNumber();
 * console.log(value);
 * ```
 */
export class CpeNumber {
	readonly serie: string;
	readonly numero: string;
	readonly type: CpeType;

	private constructor(serie: string, numero: string, type: CpeType) {
		this.serie = serie;
		this.numero = numero;
		this.type = type;
	}

	static create(value: string): CpeNumber {
		const normalized = value.trim().toUpperCase();

		// Format: XXXX-NNNNNNNN (series can have numbers, e.g., F001)
		const match = normalized.match(/^([A-Z0-9]{4})-(\d{8})$/);

		if (!match) {
			throw new Error(
				"CPE number format invalid (expected: XXXX-NNNNNNNN, e.g., F001-00001234)",
			);
		}

		const [, serie, numero] = match;
		const type = this.inferType(serie);

		return new CpeNumber(serie, numero, type);
	}

	private static inferType(serie: string): CpeType {
		const prefix = serie.substring(0, 1);

		switch (prefix) {
			case "F":
				return "FACTURA";
			case "B":
				return "BOLETA";
			case "N":
				return serie.startsWith("NC") ? "NOTA_CREDITO" : "NOTA_DEBITO";
			default:
				throw new Error(`Unknown CPE type for serie: ${serie}`);
		}
	}

	toString(): string {
		return `${this.serie}-${this.numero}`;
	}

	equals(other: CpeNumber): boolean {
		return this.serie === other.serie && this.numero === other.numero;
	}
}
