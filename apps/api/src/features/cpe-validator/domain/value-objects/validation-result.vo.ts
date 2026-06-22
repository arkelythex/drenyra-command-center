/**
 * Validation Result Value Object
 * Represents outcome of CPE validation
 * @example
 * ```ts
 * const value: ValidationStatus = {} as ValidationStatus;
 * console.log(value);
 * ```
 */

export type ValidationStatus =
	| "VALID"
	| "INVALID_SCHEMA"
	| "INVALID_RUC"
	| "REJECTED_SUNAT"
	| "TIMEOUT"
	| "BREACH_DETECTED";

/**
 * ValidationError interface.
 *
 * @example
 * ```ts
 * const value: ValidationError = {} as ValidationError;
 * console.log(value);
 * ```
 */
export interface ValidationError {
	code: string;
	message: string;
	field?: string;
}

/**
 * ValidationResult class.
 *
 * @example
 * ```ts
 * const value = new ValidationResult();
 * console.log(value);
 * ```
 */
export class ValidationResult {
	private static readonly FAST_TARGET_MS = Number(
		process.env.CPE_BREACH_TARGET_MS ?? 5000,
	);
	readonly status: ValidationStatus;
	readonly isValid: boolean;
	readonly errors: ValidationError[];
	readonly warnings: string[];
	readonly validatedAt: Date;
	readonly durationMs: number;

	private constructor(
		status: ValidationStatus,
		errors: ValidationError[],
		warnings: string[],
		durationMs: number,
	) {
		this.status = status;
		this.isValid = status === "VALID";
		this.errors = errors;
		this.warnings = warnings;
		this.validatedAt = new Date();
		this.durationMs = durationMs;
	}

	static valid(durationMs: number, warnings: string[] = []): ValidationResult {
		return new ValidationResult("VALID", [], warnings, durationMs);
	}

	static invalid(
		status: Exclude<ValidationStatus, "VALID">,
		errors: ValidationError[],
		durationMs: number,
	): ValidationResult {
		return new ValidationResult(status, errors, [], durationMs);
	}

	static breach(reason: string, durationMs: number): ValidationResult {
		return new ValidationResult(
			"BREACH_DETECTED",
			[{ code: "BREACH", message: reason }],
			[],
			durationMs,
		);
	}

	isFast(): boolean {
		return this.durationMs < ValidationResult.FAST_TARGET_MS;
	}
}
