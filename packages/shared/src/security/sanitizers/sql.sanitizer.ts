const SQL_INJECTION_PATTERNS = [
	/(%27)|(')|(--)|(%23)|(#)/i,
	/((%3D)|(=))[^\n]*((%27)|(')|(--)|(%3B)|(;))/i,
	/\w*((%27)|('))((%6F)|o|(%4F))((%72)|r|(%52))/i,
	/((%27)|('))union/i,
	/exec(\s|\+)+(s|x)p\w+/i,
	/UNION\s+SELECT/i,
	/INSERT\s+INTO/i,
	/DELETE\s+FROM/i,
	/DROP\s+TABLE/i,
] as const;

/**
 * Options to control SQL input sanitization behavior.
 *
 * @example
 * ```ts
 * const options: SqlSanitizerOptions = { maxLength: 80, strictMode: true };
 * ```
 */
export interface SqlSanitizerOptions {
	maxLength?: number;
	strictMode?: boolean;
	additionalEscapes?: string[];
}

/**
 * Structured result from SQL sanitization.
 *
 * @example
 * ```ts
 * const result: SqlSanitizeResult = {
 *   value: "cliente\\_1",
 *   wasModified: true,
 *   injectionDetected: false,
 *   originalLength: 10,
 * };
 * ```
 */
export interface SqlSanitizeResult {
	value: string;
	wasModified: boolean;
	injectionDetected: boolean;
	originalLength: number;
}

const DEFAULT_OPTIONS: Required<SqlSanitizerOptions> = {
	maxLength: 100,
	strictMode: true,
	additionalEscapes: [],
};

function detectInjectionAttempt(input: string): boolean {
	return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

function escapeSpecialChars(input: string): string {
	return input
		.replace(/\\/g, "\\\\")
		.replace(/%/g, "\\%")
		.replace(/_/g, "\\_")
		.replace(/'/g, "''")
		.replace(/"/g, '""')
		.replace(/\[/g, "\\[")
		.replace(/\]/g, "\\]")
		.replace(/\^/g, "\\^")
		.replace(/;/g, "\\;");
}

/**
 * Sanitizes unknown user input into a SQL-safe textual value.
 *
 * @param input - Raw user-provided value
 * @param options - Sanitization config (length, strict mode, extra escapes)
 * @returns Metadata-rich sanitization result
 * @throws Error when sanitizeSqlInput cannot complete successfully.
 * @example
 * ```ts
 * const result = sanitizeSqlInput("ACME%' OR 1=1 --");
 * // { value: "ACME\\%'' OR 1=1 --", wasModified: true, ... }
 * ```
 */
export function sanitizeSqlInput(
	input: unknown,
	options: SqlSanitizerOptions = {},
): SqlSanitizeResult {
	const config = { ...DEFAULT_OPTIONS, ...options };

	if (typeof input !== "string") {
		if (config.strictMode) {
			throw new TypeError(`Expected string input, received ${typeof input}`);
		}
		return {
			value: "",
			wasModified: true,
			injectionDetected: false,
			originalLength: 0,
		};
	}

	const originalLength = input.length;

	if (!input.trim()) {
		return {
			value: "",
			wasModified: originalLength > 0,
			injectionDetected: false,
			originalLength,
		};
	}

	const injectionDetected = detectInjectionAttempt(input);
	let sanitized = escapeSpecialChars(input);

	const wasTruncated = sanitized.length > config.maxLength;
	if (wasTruncated) {
		sanitized = sanitized.slice(0, config.maxLength);
	}

	sanitized = sanitized.trim();

	return {
		value: sanitized,
		wasModified: injectionDetected || wasTruncated || sanitized !== input,
		injectionDetected,
		originalLength,
	};
}

/**
 * Builds a SQL `LIKE` pattern from sanitized user input.
 *
 * @param searchTerm - Raw search term
 * @param options - Sanitizer options plus wildcard placement mode
 * @returns Safe pattern plus validation/injection flags
 * @example
 * ```ts
 * const pattern = createSafeLikePattern("cliente", { patternType: "prefix" });
 * // { pattern: "cliente%", isValid: true, injectionDetected: false }
 * ```
 */
export function createSafeLikePattern(
	searchTerm: unknown,
	options?: SqlSanitizerOptions & {
		patternType?: "prefix" | "suffix" | "contains";
	},
): {
	pattern: string;
	isValid: boolean;
	injectionDetected: boolean;
} {
	const sanitized = sanitizeSqlInput(searchTerm, options);

	if (!sanitized.value) {
		return {
			pattern: "",
			isValid: false,
			injectionDetected: sanitized.injectionDetected,
		};
	}

	const patternType = options?.patternType ?? "contains";
	let pattern: string;

	switch (patternType) {
		case "prefix":
			pattern = `${sanitized.value}%`;
			break;
		case "suffix":
			pattern = `%${sanitized.value}`;
			break;
		default:
			pattern = `%${sanitized.value}%`;
			break;
	}

	return {
		pattern,
		isValid: true,
		injectionDetected: sanitized.injectionDetected,
	};
}
