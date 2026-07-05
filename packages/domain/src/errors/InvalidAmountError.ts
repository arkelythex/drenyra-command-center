/**
 * Domain Error: Invalid Amount
 * Thrown when monetary amount validation fails
 *
 * @example
 * ```ts
 * throw new InvalidAmountError(-1);
 * ```
 */

export class InvalidAmountError extends Error {
	constructor(
		public readonly invalidValue: number,
		message?: string,
	) {
		super(message || `Monto inválido: ${invalidValue}`);
		this.name = "InvalidAmountError";

		// V8-specific stack trace capture (safe to call)
		const ErrorWithCapture = Error as typeof Error & {
			captureStackTrace?: (
				target: object,
				constructor?: { prototype: unknown },
			) => void;
		};
		if (ErrorWithCapture.captureStackTrace) {
			ErrorWithCapture.captureStackTrace(
				this,
				InvalidAmountError as new (
					...args: unknown[]
				) => unknown,
			);
		}
	}

	toJSON() {
		return {
			name: this.name,
			message: this.message,
			invalidValue: this.invalidValue,
			code: "INVALID_AMOUNT",
		};
	}
}
