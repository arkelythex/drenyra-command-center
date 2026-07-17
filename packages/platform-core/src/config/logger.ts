import pino from "pino";

const isDevelopment = process.env.NODE_ENV !== "production";
const isBun = Boolean(process.versions?.bun);
const enablePretty =
	isDevelopment && !isBun && process.env.LOG_PRETTY?.toLowerCase() === "true";

export const REDACTION_PLACEHOLDER = "[REDACTED]";

const SENSITIVE_KEYS = new Set<string>([
	"email",
	"ip",
	"ipaddress",
	"xforwardedfor",
	"xrealip",
	"token",
	"password",
	"secret",
	"apikey",
	"authorization",
	"cookie",
	"ruc",
	"accountnumber",
	"useremail",
	"useragent",
]);

function normalizeKey(key: string): string {
	return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isSensitiveKey(key: string): boolean {
	const normalized = normalizeKey(key);
	if (SENSITIVE_KEYS.has(normalized)) return true;

	return (
		normalized.endsWith("email") ||
		normalized.endsWith("token") ||
		normalized.endsWith("password") ||
		normalized.endsWith("secret") ||
		normalized.endsWith("apikey") ||
		normalized.endsWith("ipaddress") ||
		normalized.endsWith("ruc") ||
		normalized.endsWith("accountnumber")
	);
}

function redactNode(value: unknown, seen: WeakSet<object>): unknown {
	if (!isRecord(value)) {
		if (Array.isArray(value)) {
			return value.map((entry) => redactNode(entry, seen));
		}
		return value;
	}

	if (seen.has(value)) {
		return REDACTION_PLACEHOLDER;
	}

	seen.add(value);

	if (Array.isArray(value)) {
		return value.map((entry) => redactNode(entry, seen));
	}

	const output: Record<string, unknown> = {};
	for (const [key, entry] of Object.entries(value)) {
		if (isSensitiveKey(key)) {
			output[key] = REDACTION_PLACEHOLDER;
			continue;
		}

		output[key] = redactNode(entry, seen);
	}

	return output;
}

export function redactLogPayload(payload: unknown): unknown {
	if (!isRecord(payload) && !Array.isArray(payload)) {
		return payload;
	}

	return redactNode(payload, new WeakSet<object>());
}

export const rootLogger = pino({
	level: process.env.LOG_LEVEL ?? (isDevelopment ? "debug" : "info"),
	formatters: {
		level: (label) => ({ level: label }),
		bindings: (bindings) => ({
			pid: bindings.pid,
			hostname: bindings.hostname,
		}),
		log: (object) => {
			const redacted = redactLogPayload(object);
			return isRecord(redacted) ? redacted : object;
		},
	},
	redact: {
		paths: [
			"req.headers.authorization",
			"req.headers.cookie",
			"*.password",
			"*.token",
			"*.secret",
			"*.apiKey",
		],
		remove: true,
	},
	serializers: {
		req: (req: unknown) => {
			const r = req as {
				method?: string;
				url?: string;
				path?: string;
				headers?: Record<string, string | undefined>;
			};
			return {
				method: r.method,
				url: r.url,
				path: r.path,
				headers: {
					host: r.headers?.host,
					userAgent: r.headers?.["user-agent"],
					contentType: r.headers?.["content-type"],
				},
				correlationId: r.headers?.["x-correlation-id"],
			};
		},
		res: (res: unknown) => {
			const r = res as {
				statusCode?: number;
				headers?: Record<string, string | undefined>;
			};
			return {
				statusCode: r.statusCode,
				headers: { contentType: r.headers?.["content-type"] },
			};
		},
		err: pino.stdSerializers.err,
	},
	timestamp: pino.stdTimeFunctions.isoTime,
	...(enablePretty && {
		transport: {
			target: "pino-pretty",
			options: {
				colorize: true,
				translateTime: "HH:MM:ss.l",
				ignore: "pid,hostname",
			},
		},
	}),
});

export function createLogger(context: Record<string, unknown>) {
	return rootLogger.child(context);
}

export function logRequest(
	method: string,
	path: string,
	statusCode: number,
	duration: number,
	correlationId?: string,
) {
	const log = { method, path, statusCode, duration, correlationId };
	if (statusCode >= 500) rootLogger.error(log, "Request failed");
	else if (statusCode >= 400) rootLogger.warn(log, "Client error");
	else rootLogger.info(log, "Request completed");
}

export async function logOperation<T>(
	operation: string,
	context: Record<string, unknown>,
	fn: () => Promise<T>,
): Promise<T> {
	const start = Date.now();
	const child = createLogger({ operation, ...context });
	child.info("Operation started");
	try {
		const result = await fn();
		child.info({ duration: Date.now() - start }, "Operation completed");
		return result;
	} catch (error) {
		child.error({ error, duration: Date.now() - start }, "Operation failed");
		throw error;
	}
}
