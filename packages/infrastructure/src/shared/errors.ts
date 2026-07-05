/**
 * Temporary error classes for infrastructure package
 * FIXME: Infrastructure should not depend on app-specific errors
 * @example
 * ```ts
 * const value = new AppError();
 * console.log(value);
 * ```
 */

export class AppError extends Error {
	constructor(
		message: string,
		public code?: string,
	) {
		super(message);
		this.name = "AppError";
	}
}

/**
 * ValidationError class.
 *
 * @example
 * ```ts
 * const value = new ValidationError();
 * console.log(value);
 * ```
 */
export class ValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ValidationError";
	}
}

/**
 * NotFoundError class.
 *
 * @example
 * ```ts
 * const value = new NotFoundError();
 * console.log(value);
 * ```
 */
export class NotFoundError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "NotFoundError";
	}
}

/**
 * UnauthorizedError class.
 *
 * @example
 * ```ts
 * const value = new UnauthorizedError();
 * console.log(value);
 * ```
 */
export class UnauthorizedError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "UnauthorizedError";
	}
}
