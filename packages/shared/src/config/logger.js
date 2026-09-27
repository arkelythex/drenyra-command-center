import pino from "pino";
const isDevelopment = process.env.NODE_ENV !== "production";
const isBun = Boolean(process.versions?.bun);
const enablePretty = isDevelopment && !isBun && process.env.LOG_PRETTY?.toLowerCase() === "true";
export const REDACTION_PLACEHOLDER = "[REDACTED]";
const SENSITIVE_KEYS = new Set([
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
function normalizeKey(key) {
    return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
function isSensitiveKey(key) {
    const normalized = normalizeKey(key);
    if (SENSITIVE_KEYS.has(normalized))
        return true;
    return (normalized.endsWith("email") ||
        normalized.endsWith("token") ||
        normalized.endsWith("password") ||
        normalized.endsWith("secret") ||
        normalized.endsWith("apikey") ||
        normalized.endsWith("ipaddress") ||
        normalized.endsWith("ruc") ||
        normalized.endsWith("accountnumber"));
}
function redactNode(value, seen) {
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
    const output = {};
    for (const [key, entry] of Object.entries(value)) {
        if (isSensitiveKey(key)) {
            output[key] = REDACTION_PLACEHOLDER;
            continue;
        }
        output[key] = redactNode(entry, seen);
    }
    return output;
}
export function redactLogPayload(payload) {
    if (!isRecord(payload) && !Array.isArray(payload)) {
        return payload;
    }
    return redactNode(payload, new WeakSet());
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
        req: (req) => {
            const r = req;
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
        res: (res) => {
            const r = res;
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
export function createLogger(context) {
    return rootLogger.child(context);
}
export function logRequest(method, path, statusCode, duration, correlationId) {
    const log = { method, path, statusCode, duration, correlationId };
    if (statusCode >= 500)
        rootLogger.error(log, "Request failed");
    else if (statusCode >= 400)
        rootLogger.warn(log, "Client error");
    else
        rootLogger.info(log, "Request completed");
}
export async function logOperation(operation, context, fn) {
    const start = Date.now();
    const child = createLogger({ operation, ...context });
    child.info("Operation started");
    try {
        const result = await fn();
        child.info({ duration: Date.now() - start }, "Operation completed");
        return result;
    }
    catch (error) {
        child.error({ error, duration: Date.now() - start }, "Operation failed");
        throw error;
    }
}
//# sourceMappingURL=logger.js.map