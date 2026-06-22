/**
 * DNI (Documento Nacional de Identidad) Value Object
 * Peruvian National Identity Document
 *
 * Rules:
 * - Exactly 8 numeric digits
 * - No validation algorithm (unlike RUC)
 * - Used for natural persons in invoices (Boletas)
 */

import { InvalidDNIError } from "../errors/InvalidDNIError";

/**
 * DNI (Documento Nacional de Identidad) value object.
 *
 * @throws {InvalidDNIError} When the DNI format is invalid
 *
 * @example
 * ```ts
 * const dni = DNI.create("12345678");
 * dni.format(); // "12 345 678"
 * ```
 */
export class DNI {
	private constructor(private readonly value: string) {
		Object.freeze(this);
	}

	/**
	 * Create a DNI from string value
	 * @param value - 8-digit string
	 * @throws InvalidDNIError if validation fails
	 */
	static create(value: string): DNI {
		const trimmed = value.trim();

		if (!DNI.isValid(trimmed)) {
			throw new InvalidDNIError(value);
		}

		return new DNI(trimmed);
	}

	/**
	 * Validate DNI format
	 */
	private static isValid(dni: string): boolean {
		// Must be exactly 8 digits
		if (dni.length !== 8) {
			return false;
		}

		// Must be all numeric
		if (!/^\d{8}$/.test(dni)) {
			return false;
		}

		return true;
	}

	/**
	 * Get the raw DNI value
	 */
	toString(): string {
		return this.value;
	}

	/**
	 * Format DNI with spaces for readability
	 * Example: 12345678 -> 12 345 678
	 */
	format(): string {
		return `${this.value.slice(0, 2)} ${this.value.slice(2, 5)} ${this.value.slice(5)}`;
	}

	/**
	 * Check equality with another DNI
	 */
	equals(other: DNI | null | undefined): boolean {
		if (!other) {
			return false;
		}
		return this.value === other.value;
	}

	/**
	 * Serialize to JSON
	 */
	toJSON(): { value: string } {
		return { value: this.value };
	}

	/**
	 * Deserialize from JSON
	 */
	static fromJSON(json: { value: string }): DNI {
		return DNI.create(json.value);
	}
}
