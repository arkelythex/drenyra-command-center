/**
 * Agent Error Hierarchy
 *
 * Typed error system for agent execution failures.
 * Enables classification into TRANSIENT (retryable), PERMANENT (non-retryable),
 * and UNKNOWN categories for precise error recovery decisions.
 *
 * @module ai/services/error-recovery
 */

// ─── Base Error ───────────────────────────────────────────────────────────────

export class AgentError extends Error {
	readonly type: "TRANSIENT" | "PERMANENT" | "UNKNOWN";
	readonly agentName: string;
	readonly recoverable: boolean;
	readonly retryable: boolean;
	readonly details: Record<string, unknown>;

	constructor(opts: {
		message: string;
		type: "TRANSIENT" | "PERMANENT" | "UNKNOWN";
		agentName: string;
		details?: Record<string, unknown> | undefined;
	}) {
		super(opts.message);
		this.name = "AgentError";
		this.type = opts.type;
		this.agentName = opts.agentName;
		this.details = opts.details ?? {};

		// TRANSIENT and UNKNOWN errors are retryable and recoverable
		this.retryable = opts.type === "TRANSIENT" || opts.type === "UNKNOWN";
		this.recoverable = opts.type === "TRANSIENT" || opts.type === "UNKNOWN";
	}
}

// ─── Transient Subclasses ─────────────────────────────────────────────────────

/**
 * TimeoutError — agent execution exceeded its time limit.
 */
export class TimeoutError extends AgentError {
	override readonly type: "TRANSIENT" = "TRANSIENT";

	constructor(opts: {
		message?: string;
		agentName: string;
		details?: Record<string, unknown> | undefined;
	}) {
		super({
			message: opts.message ?? `Agent ${opts.agentName} timed out`,
			type: "TRANSIENT",
			agentName: opts.agentName,
			details: opts.details,
		});
		this.name = "TimeoutError";
	}
}

/**
 * RateLimitError — provider returned a rate limit response.
 */
export class RateLimitError extends AgentError {
	override readonly type: "TRANSIENT" = "TRANSIENT";
	readonly retryAfter?: number | undefined;

	constructor(opts: {
		message?: string;
		agentName: string;
		retryAfter?: number;
		details?: Record<string, unknown>;
	}) {
		super({
			message:
				opts.message ?? `Rate limit exceeded for agent ${opts.agentName}`,
			type: "TRANSIENT",
			agentName: opts.agentName,
			details: { ...opts.details, retryAfter: opts.retryAfter },
		});
		this.name = "RateLimitError";
		this.retryAfter = opts.retryAfter;
	}
}

/**
 * NetworkError — transient network or connection failure.
 */
export class NetworkError extends AgentError {
	override readonly type: "TRANSIENT" = "TRANSIENT";

	constructor(opts: {
		message?: string;
		agentName: string;
		details?: Record<string, unknown>;
	}) {
		super({
			message: opts.message ?? `Network error for agent ${opts.agentName}`,
			type: "TRANSIENT",
			agentName: opts.agentName,
			details: opts.details,
		});
		this.name = "NetworkError";
	}
}

/**
 * ProviderError — AI provider returned an error response.
 */
export class ProviderError extends AgentError {
	override readonly type: "TRANSIENT" = "TRANSIENT";
	readonly provider: string;
	readonly statusCode?: number | undefined;

	constructor(opts: {
		message?: string;
		agentName: string;
		provider: string;
		statusCode?: number;
		details?: Record<string, unknown>;
	}) {
		super({
			message:
				opts.message ??
				`Provider ${opts.provider} error for agent ${opts.agentName}`,
			type: "TRANSIENT",
			agentName: opts.agentName,
			details: {
				...opts.details,
				provider: opts.provider,
				statusCode: opts.statusCode,
			},
		});
		this.name = "ProviderError";
		this.provider = opts.provider;
		this.statusCode = opts.statusCode;
	}
}

// ─── Permanent Subclasses ─────────────────────────────────────────────────────

/**
 * ValidationError — agent output failed validation checks.
 */
export class ValidationError extends AgentError {
	override readonly type: "PERMANENT" = "PERMANENT";

	constructor(opts: {
		message?: string;
		agentName: string;
		details?: Record<string, unknown>;
	}) {
		super({
			message: opts.message ?? `Validation failed for agent ${opts.agentName}`,
			type: "PERMANENT",
			agentName: opts.agentName,
			details: opts.details,
		});
		this.name = "ValidationError";
	}
}

/**
 * InvalidInputError — agent received invalid or malformed input.
 */
export class InvalidInputError extends AgentError {
	override readonly type: "PERMANENT" = "PERMANENT";

	constructor(opts: {
		message?: string;
		agentName: string;
		details?: Record<string, unknown>;
	}) {
		super({
			message: opts.message ?? `Invalid input for agent ${opts.agentName}`,
			type: "PERMANENT",
			agentName: opts.agentName,
			details: opts.details,
		});
		this.name = "InvalidInputError";
	}
}

/**
 * FiscalViolationError — operation violates a fiscal/regulatory rule.
 */
export class FiscalViolationError extends AgentError {
	override readonly type: "PERMANENT" = "PERMANENT";

	constructor(opts: {
		message?: string;
		agentName: string;
		details?: Record<string, unknown>;
	}) {
		super({
			message:
				opts.message ?? `Fiscal violation detected for agent ${opts.agentName}`,
			type: "PERMANENT",
			agentName: opts.agentName,
			details: opts.details,
		});
		this.name = "FiscalViolationError";
	}
}

// ─── Classification Helper ────────────────────────────────────────────────────

/**
 * Classify an unknown error into a typed AgentError based on message patterns.
 *
 * Classification rules:
 * - timeout, network, econnrefused, econnreset → TRANSIENT
 * - 429, 5xx → TRANSIENT
 * - validation, invalid, forbidden, 400, 403 → PERMANENT
 * - everything else → UNKNOWN
 *
 * @param err - The raw error to classify
 * @param agentName - The agent name for the resulting AgentError
 * @returns A typed AgentError subclass
 */
export function classifyError(err: unknown, agentName: string): AgentError {
	const message =
		err instanceof Error
			? err.message
			: err != null
				? String(err)
				: "Unknown error";
	const lower = message.toLowerCase();

	// TRANSIENT patterns
	const transientPatterns = [
		"timeout",
		"timed out",
		"network",
		"econnrefused",
		"econnreset",
		"econnaborted",
		"etimedout",
		"429",
		"500",
		"502",
		"503",
		"504",
		"rate limit",
		"too many requests",
		"service unavailable",
		"internal server error",
		"bad gateway",
		"gateway timeout",
	];

	for (const pattern of transientPatterns) {
		if (lower.includes(pattern)) {
			// Return more specific subclass for known transient patterns
			if (
				pattern.includes("rate limit") ||
				pattern === "too many requests" ||
				pattern === "429"
			) {
				return new RateLimitError({ message, agentName });
			}
			if (
				pattern.includes("timeout") ||
				pattern === "timed out" ||
				pattern === "etimedout"
			) {
				return new TimeoutError({ message, agentName });
			}
			if (
				pattern.includes("network") ||
				pattern === "econnrefused" ||
				pattern === "econnreset" ||
				pattern === "econnaborted"
			) {
				return new NetworkError({ message, agentName });
			}
			if (pattern === "502" || pattern === "503" || pattern === "504") {
				return new ProviderError({
					message,
					agentName,
					provider: "unknown",
					statusCode: parseInt(pattern, 10),
				});
			}
			return new NetworkError({ message, agentName });
		}
	}

	// PERMANENT patterns
	const permanentPatterns = [
		"validation",
		"invalid",
		"forbidden",
		"400",
		"403",
		"unauthorized",
		"not found",
		"bad request",
		"fiscal",
		"violation",
		"schema",
		"malformed",
	];

	for (const pattern of permanentPatterns) {
		if (lower.includes(pattern)) {
			if (pattern === "validation" || pattern === "schema") {
				return new ValidationError({ message, agentName });
			}
			if (
				pattern === "invalid" ||
				pattern === "malformed" ||
				pattern === "bad request" ||
				pattern === "400"
			) {
				return new InvalidInputError({ message, agentName });
			}
			if (
				pattern === "forbidden" ||
				pattern === "unauthorized" ||
				pattern === "403"
			) {
				return new InvalidInputError({ message, agentName });
			}
			if (pattern === "fiscal" || pattern === "violation") {
				return new FiscalViolationError({ message, agentName });
			}
			return new ValidationError({ message, agentName });
		}
	}

	// Default: UNKNOWN
	return new AgentError({
		message,
		type: "UNKNOWN",
		agentName,
	});
}
