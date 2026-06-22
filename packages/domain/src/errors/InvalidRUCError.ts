/**
 * Domain Error: Invalid RUC
 * Thrown when RUC validation fails
 *
 * @example
 * ```ts
 * throw new InvalidRUCError("2012345678");
 * ```
 */

export class InvalidRUCError extends Error {
	constructor(
		public readonly invalidValue: string,
		message?: string,
	) {
		super(
			message ||
				`RUC inválido: "${invalidValue}". Debe tener 11 dígitos y pasar validación modulo-11`,
		);
		this.name = "InvalidRUCError";

		// V8-specific stack trace capture (safe to call)
		const ErrorWithCapture = Error as typeof Error & {
			captureStackTrace?: (
				target: object,
				constructor?: { prototype: unknown },
			) => void;
		};
		if (ErrorWithCapture.captureStackTrace) {
			ErrorWithCapture.captureStackTrace(this, InvalidRUCError as new (...args: unknown[]) => unknown);
		}
	}

	/**
	 * Get error details for API response
	 */
	toJSON() {
		return {
			name: this.name,
			message: this.message,
			invalidValue: this.invalidValue,
			code: "INVALID_RUC",
		};
	}
}
