/**
 * Error thrown when DNI validation fails
 *
 * @example
 * ```ts
 * throw new InvalidDNIError("123");
 * ```
 */
export class InvalidDNIError extends Error {
	constructor(dni: string) {
		super(
			`DNI inválido: "${dni}". El DNI debe tener exactamente 8 dígitos numéricos.`,
		);
		this.name = "InvalidDNIError";
		Object.setPrototypeOf(this, InvalidDNIError.prototype);
	}
}
