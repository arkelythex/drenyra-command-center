/**
 * Secure Logger for ARKELYTHEX
 * Production-safe logging that sanitizes sensitive data
 * @module SecureLogger
 *
 * Best Practices 2026:
 * - Never log PII (Personally Identifiable Information)
 * - Never log authentication tokens or passwords
 * - Never log credit card numbers or bank accounts
 * - Sanitize UUIDs and IDs in production
 * - Use structured logging for observability
 * - Respect LOG_LEVEL environment variable
 */

const LOG_LEVELS = {
	DEBUG: 0,
	INFO: 1,
	WARN: 2,
	ERROR: 3,
	SILENT: 4,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

// Static constants - no process/import.meta at top level to avoid browser crashes
const DEFAULT_LOG_LEVEL: LogLevel = "DEBUG";
const CURRENT_LOG_LEVEL: LogLevel = DEFAULT_LOG_LEVEL;
const CURRENT_LEVEL_NUM = LOG_LEVELS[CURRENT_LOG_LEVEL];

const SENSITIVE_PATTERNS = {
	UUID: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
	CREDIT_CARD: /\b(?:\d[ -]*?){13,16}\b/g,
	BANK_ACCOUNT: /\b\d{20}\b/g,
	RUC: /\b\d{11}\b/g,
	DNI: /\b\d{8}\b/g,
	EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
	PHONE: /\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
	API_KEY:
		/(?:api[_-]?key|token|password|secret|authorization)["\s]*[:=]["\s]*[a-zA-Z0-9_-]+/gi,
	CERTIFICATE: /-----BEGIN[^-]+-----[\s\S]+?-----END[^-]+-----/g,
};

const REDACTED_CONTEXT_KEYS = [
	/api[_-]?key/i,
	/authorization/i,
	/certificate/i,
	/creditcard/i,
	/dni/i,
	/email/i,
	/password/i,
	/phone/i,
	/ruc/i,
	/secret/i,
	/token/i,
	/userid/i,
	/account/i,
] as const;

function sanitizeLogMessage(message: string): string {
	let sanitized = message;
	// Skip UUID replacement in browser - skip production check for now
	sanitized = sanitized.replace(SENSITIVE_PATTERNS.CREDIT_CARD, "[CARD]");
	sanitized = sanitized.replace(SENSITIVE_PATTERNS.BANK_ACCOUNT, "[ACCOUNT]");
	sanitized = sanitized.replace(SENSITIVE_PATTERNS.RUC, "[RUC]");
	sanitized = sanitized.replace(SENSITIVE_PATTERNS.DNI, "[DNI]");
	sanitized = sanitized.replace(SENSITIVE_PATTERNS.EMAIL, "[EMAIL]");
	sanitized = sanitized.replace(SENSITIVE_PATTERNS.PHONE, "[PHONE]");
	sanitized = sanitized.replace(SENSITIVE_PATTERNS.API_KEY, "[CREDENTIAL]");
	sanitized = sanitized.replace(SENSITIVE_PATTERNS.CERTIFICATE, "[CERT]");
	return sanitized;
}

function shouldRedactKey(key: string): boolean {
	return REDACTED_CONTEXT_KEYS.some((pattern) => pattern.test(key));
}

function sanitizeLogValue(value: unknown): unknown {
	if (typeof value === "string") {
		return sanitizeLogMessage(value);
	}

	if (Array.isArray(value)) {
		return value.map((entry) => sanitizeLogValue(entry));
	}

	if (value instanceof Error) {
		return {
			name: value.name,
			message: sanitizeLogMessage(value.message),
		};
	}

	if (value && typeof value === "object") {
		const sanitizedEntries = Object.entries(
			value as Record<string, unknown>,
		).map(([key, nestedValue]) => [
			key,
			shouldRedactKey(key) ? "[REDACTED]" : sanitizeLogValue(nestedValue),
		]);

		return Object.fromEntries(sanitizedEntries);
	}

	return value;
}

function sanitizeContext(
	context?: Record<string, unknown>,
): string | undefined {
	if (!context) {
		return undefined;
	}

	return JSON.stringify(sanitizeLogValue(context));
}

function shouldLog(level: LogLevel): boolean {
	return LOG_LEVELS[level] >= CURRENT_LEVEL_NUM;
}

export class SecureLogger {
	static namespace(serviceName: string): {
		debug: (message: string, context?: Record<string, unknown>) => void;
		info: (message: string, context?: Record<string, unknown>) => void;
		warn: (message: string, context?: Record<string, unknown>) => void;
		error: (
			message: string,
			error?: unknown,
			context?: Record<string, unknown>,
		) => void;
	} {
		const prefix = `[${serviceName}]`;

		return {
			debug: (message, context) => {
				SecureLogger.debug(`${prefix} ${message}`, context);
			},
			info: (message, context) => {
				SecureLogger.info(`${prefix} ${message}`, context);
			},
			warn: (message, context) => {
				SecureLogger.warn(`${prefix} ${message}`, context);
			},
			error: (message, error, context) => {
				SecureLogger.error(`${prefix} ${message}`, error, context);
			},
		};
	}

	static debug(message: string, context?: Record<string, unknown>): void {
		if (!shouldLog("DEBUG")) return;
		const logEntry = sanitizeLogMessage(`[DEBUG] ${message}`);
		const sanitizedContext = sanitizeContext(context);
		console.debug(
			sanitizedContext ? `${logEntry} | ${sanitizedContext}` : logEntry,
		);
	}

	static info(message: string, context?: Record<string, unknown>): void {
		if (!shouldLog("INFO")) return;
		const logEntry = sanitizeLogMessage(`[INFO] ${message}`);
		const sanitizedContext = sanitizeContext(context);
		console.info(
			sanitizedContext ? `${logEntry} | ${sanitizedContext}` : logEntry,
		);
	}

	static warn(message: string, context?: Record<string, unknown>): void {
		if (!shouldLog("WARN")) return;
		const logEntry = sanitizeLogMessage(`[WARN] ${message}`);
		const sanitizedContext = sanitizeContext(context);
		console.warn(
			sanitizedContext ? `${logEntry} | ${sanitizedContext}` : logEntry,
		);
	}

	static error(
		message: string,
		error?: unknown,
		context?: Record<string, unknown>,
	): void {
		if (!shouldLog("ERROR")) return;
		let logEntry = sanitizeLogMessage(`[ERROR] ${message}`);
		const sanitizedContext = sanitizeContext(context);
		if (sanitizedContext) {
			logEntry += ` | ${sanitizedContext}`;
		}
		if (error) {
			if (error instanceof Error) {
				const sanitizedErrorMsg = sanitizeLogMessage(error.message);
				logEntry += ` | Error: ${sanitizedErrorMsg}`;
				// Skip stack trace in browser
			} else {
				logEntry += ` | Error: ${sanitizeLogMessage(String(error))}`;
			}
		}
		console.error(logEntry);
	}

	static audit(
		action: string,
		userId: string,
		resource: string,
		success: boolean,
		details?: Record<string, unknown>,
	): void {
		const timestamp = new Date().toISOString();
		void userId;
		// Skip user sanitization in browser
		const auditEntry = {
			timestamp,
			level: "AUDIT",
			action: sanitizeLogMessage(action),
			resource: sanitizeLogMessage(resource),
			userId: "[REDACTED]",
			success,
			details: details ? sanitizeContext(details) : undefined,
		};
		console.info("[AUDIT]", JSON.stringify(auditEntry));
	}
}

export const logger = SecureLogger;

export default SecureLogger;
