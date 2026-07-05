const LOG_LEVELS = {
	DEBUG: 0,
	INFO: 1,
	WARN: 2,
	ERROR: 3,
	SILENT: 4,
};
const DEFAULT_LOG_LEVEL = "DEBUG";
const CURRENT_LOG_LEVEL = DEFAULT_LOG_LEVEL;
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
];
function sanitizeLogMessage(message) {
	let sanitized = message;
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
function shouldRedactKey(key) {
	return REDACTED_CONTEXT_KEYS.some((pattern) => pattern.test(key));
}
function sanitizeLogValue(value) {
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
		const sanitizedEntries = Object.entries(value).map(([key, nestedValue]) => [
			key,
			shouldRedactKey(key) ? "[REDACTED]" : sanitizeLogValue(nestedValue),
		]);
		return Object.fromEntries(sanitizedEntries);
	}
	return value;
}
function sanitizeContext(context) {
	if (!context) {
		return undefined;
	}
	return JSON.stringify(sanitizeLogValue(context));
}
function shouldLog(level) {
	return LOG_LEVELS[level] >= CURRENT_LEVEL_NUM;
}
export class SecureLogger {
	static namespace(serviceName) {
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
	static debug(message, context) {
		if (!shouldLog("DEBUG")) return;
		const logEntry = sanitizeLogMessage(`[DEBUG] ${message}`);
		const sanitizedContext = sanitizeContext(context);
		console.debug(
			sanitizedContext ? `${logEntry} | ${sanitizedContext}` : logEntry,
		);
	}
	static info(message, context) {
		if (!shouldLog("INFO")) return;
		const logEntry = sanitizeLogMessage(`[INFO] ${message}`);
		const sanitizedContext = sanitizeContext(context);
		console.info(
			sanitizedContext ? `${logEntry} | ${sanitizedContext}` : logEntry,
		);
	}
	static warn(message, context) {
		if (!shouldLog("WARN")) return;
		const logEntry = sanitizeLogMessage(`[WARN] ${message}`);
		const sanitizedContext = sanitizeContext(context);
		console.warn(
			sanitizedContext ? `${logEntry} | ${sanitizedContext}` : logEntry,
		);
	}
	static error(message, error, context) {
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
			} else {
				logEntry += ` | Error: ${sanitizeLogMessage(String(error))}`;
			}
		}
		console.error(logEntry);
	}
	static audit(action, userId, resource, success, details) {
		const timestamp = new Date().toISOString();
		void userId;
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
//# sourceMappingURL=secure-logger.js.map
