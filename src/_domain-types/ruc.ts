/**
 * RUC (Registro Único de Contribuyentes) Value Object.
 *
 * @description Represents the official tax identification number for entities in Peru.
 * This value object ensures that the RUC has exactly 11 digits and complies
 * with the official SUNAT "Modulo 11" checksum algorithm.
 *
 * @example
 * ```typescript
 * try {
 *   const ruc = RUC.create("20546296564");
 *   console.info(ruc.getEntityType()); // "COMPANY"
 * } catch (e) {
 *   console.error("Invalid RUC provided");
 * }
 * ```
 *
 * @domain Value Object
 * @immutable
 * @since 1.0.0
 */

import { InvalidRUCError } from "../errors/InvalidRUCError";
import type { TaxIdentifier } from "../types/domain/tax-identifier";

/**
 * Clase inmutable que encapsula un RUC válido.
 *
 * @throws {InvalidRUCError} If the RUC is invalid
 *
 * @example
 * ```ts
 * const ruc = RUC.create("20546296564");
 * ruc.isCompany(); // true
 * ```
 */
export class RUC implements TaxIdentifier {
	readonly countryCode = "PE" as const;
	readonly type = "RUC" as const;

	private static readonly CHECKSUM_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
	private static readonly ALLOWED_PREFIXES = ["10", "15", "16", "17", "20"];

	private constructor(readonly value: string) {
		Object.freeze(this);
	}

	/**
	 * Método fábrica para crear una instancia de RUC.
	 * Valida el formato y el dígito verificador antes de crear el objeto.
	 *
	 * @param value - La cadena con el número de RUC.
	 * @returns Una nueva instancia de RUC.
	 * @throws InvalidRUCError si la validación falla.
	 */
	static create(value: string): RUC {
		const sanitized = value.trim();

		if (!RUC.isValid(sanitized)) {
			throw new InvalidRUCError(value);
		}

		return new RUC(sanitized);
	}

	/**
	 * Valida el RUC usando el algoritmo Módulo 11 (Validación oficial de SUNAT).
	 *
	 * @param ruc - Cadena a validar.
	 * @returns `true` si es válido.
	 */
	static isValid(ruc: string): boolean {
		// Debe tener exactamente 11 dígitos numéricos
		if (!/^\d{11}$/.test(ruc)) {
			return false;
		}

		if (!RUC.ALLOWED_PREFIXES.includes(ruc.slice(0, 2))) {
			return false;
		}

		const checkDigit = Number.parseInt(ruc[10] ?? "0", 10);

		return checkDigit === RUC.calculateExpectedCheckDigit(ruc);
	}

	private static calculateExpectedCheckDigit(ruc: string): number {
		let sum = 0;

		for (let i = 0; i < 10; i++) {
			const digit = Number.parseInt(ruc[i] ?? "0", 10);
			sum += digit * (RUC.CHECKSUM_WEIGHTS[i] ?? 0);
		}

		const remainder = sum % 11;
		const expectedCheckDigit = 11 - remainder;

		if (expectedCheckDigit === 10) return 0;
		if (expectedCheckDigit === 11) return 1;

		return expectedCheckDigit;
	}

	/**
	 * Determina el tipo de entidad basado en el prefijo del RUC.
	 * - Empieza con 10: Persona Natural.
	 * - Empieza con 20: Persona Jurídica (Empresa).
	 *
	 * @returns 'PERSON' o 'COMPANY'.
	 */
	getEntityType(): "PERSON" | "COMPANY" {
		return this.value.startsWith("10") ? "PERSON" : "COMPANY";
	}

	/**
	 * Verifica si el RUC pertenece a una Persona Natural.
	 */
	isPerson(): boolean {
		return this.getEntityType() === "PERSON";
	}

	/**
	 * Verifica si el RUC pertenece a una Empresa (Persona Jurídica).
	 */
	isCompany(): boolean {
		return this.getEntityType() === "COMPANY";
	}

	/**
	 * Formatea el RUC para visualización (separado por guiones).
	 * Ejemplo: 20-123456789-1
	 */
	format(): string {
		return `${this.value.slice(0, 2)}-${this.value.slice(2, 10)}-${this.value.slice(10)}`;
	}

	/**
	 * Obtiene el valor numérico como cadena sin formato.
	 */
	toString(): string {
		return this.value;
	}

	/**
	 * Compara si dos RUCs son iguales.
	 *
	 * @param other - Otro objeto RUC a comparar.
	 */
	equals(other: TaxIdentifier | null | undefined): boolean {
		if (!other) return false;
		return this.value === other.value;
	}

	/**
	 * Validate the RUC value (delegates to static isValid).
	 */
	validate(): boolean {
		return RUC.isValid(this.value);
	}

	/**
	 * Serialize to JSON.
	 */
	toJSON(): Record<string, unknown> {
		return {
			value: this.value,
			countryCode: this.countryCode,
			type: this.type,
		};
	}

	/**
	 * Obtiene los primeros 10 dígitos (base sin dígito verificador).
	 */
	getBase(): string {
		return this.value.slice(0, 10);
	}

	/**
	 * Obtiene el dígito verificador.
	 */
	getCheckDigit(): number {
		return Number.parseInt(this.value[10] ?? "0", 10);
	}
}
