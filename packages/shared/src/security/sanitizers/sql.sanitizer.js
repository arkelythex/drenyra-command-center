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
];
const DEFAULT_OPTIONS = {
	maxLength: 100,
	strictMode: true,
	additionalEscapes: [],
};
function detectInjectionAttempt(input) {
	return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}
function escapeSpecialChars(input) {
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
export function sanitizeSqlInput(input, options = {}) {
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
export function createSafeLikePattern(searchTerm, options) {
	const sanitized = sanitizeSqlInput(searchTerm, options);
	if (!sanitized.value) {
		return {
			pattern: "",
			isValid: false,
			injectionDetected: sanitized.injectionDetected,
		};
	}
	const patternType = options?.patternType ?? "contains";
	let pattern;
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
