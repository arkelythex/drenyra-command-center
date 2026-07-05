const isProduction = process.env.NODE_ENV === "production";
const isServer = typeof window === "undefined";
const LOG_PREFIX = "[AccountingsPro]";
const COLORS = {
	debug: "\x1b[36m",
	info: "\x1b[32m",
	warn: "\x1b[33m",
	error: "\x1b[31m",
	reset: "\x1b[0m",
};
const EMOJI = {
	debug: "🔍",
	info: "📋",
	warn: "⚠️",
	error: "❌",
};
function formatTimestamp() {
	return new Date().toISOString();
}
function formatMessage(level, message, source) {
	const timestamp = formatTimestamp();
	const prefix = source ? `${LOG_PREFIX}[${source}]` : LOG_PREFIX;
	if (isServer && !isProduction) {
		return `${COLORS[level]}${EMOJI[level]} ${timestamp} ${prefix} ${message}${COLORS.reset}`;
	}
	return `${EMOJI[level]} ${timestamp} ${prefix} ${message}`;
}
function createLogEntry(level, message, context, source) {
	return {
		timestamp: formatTimestamp(),
		level,
		message,
		context,
		source,
	};
}
function shouldLog(level) {
	if (isProduction && (level === "debug" || level === "info")) {
		return false;
	}
	return true;
}
function log(level, message, context, source) {
	if (!shouldLog(level)) return;
	const formattedMessage = formatMessage(level, message, source);
	switch (level) {
		case "debug":
			console.info(formattedMessage, context ?? "");
			break;
		case "info":
			console.info(formattedMessage, context ?? "");
			break;
		case "warn":
			console.warn(formattedMessage, context ?? "");
			break;
		case "error":
			console.error(formattedMessage, context ?? "");
			break;
	}
	if (isProduction && (level === "warn" || level === "error")) {
		createLogEntry(level, message, context, source);
	}
}
function createLogger(source) {
	return {
		debug: (message, context) => log("debug", message, context, source),
		info: (message, context) => log("info", message, context, source),
		warn: (message, context) => log("warn", message, context, source),
		error: (message, context) => log("error", message, context, source),
	};
}
export const logger = {
	debug: (message, context) => log("debug", message, context),
	info: (message, context) => log("info", message, context),
	warn: (message, context) => log("warn", message, context),
	error: (message, context) => log("error", message, context),
	create: createLogger,
};
export const loggers = {
	queue: createLogger("Queue"),
	redis: createLogger("Redis"),
	ai: createLogger("AI"),
	webhook: createLogger("Webhook"),
	validation: createLogger("Validation"),
	hitl: createLogger("HITL"),
	worker: createLogger("Worker"),
};
//# sourceMappingURL=logger.js.map
