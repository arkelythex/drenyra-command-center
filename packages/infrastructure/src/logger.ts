/**
 * Logger Service
 *
 * Centralized logging utility following 2026+ Agentic Standards.
 * Provides structured logging with context, levels, and environment awareness.
 *
 * @module infrastructure/logger
 * @since 2026 Agentic Standard
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
	[key: string]: unknown;
}

interface LogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	context?: LogContext;
	source?: string;
}

// Environment detection
const isProduction = process.env.NODE_ENV === "production";
const isServer = typeof window === "undefined";
const LOG_PREFIX = "[AccountingsPro]";

// Color codes for terminal (server-side only)
const COLORS = {
	debug: "\x1b[36m", // Cyan
	info: "\x1b[32m", // Green
	warn: "\x1b[33m", // Yellow
	error: "\x1b[31m", // Red
	reset: "\x1b[0m",
};

// Emoji prefixes for better visual parsing
const EMOJI = {
	debug: "🔍",
	info: "📋",
	warn: "⚠️",
	error: "❌",
};

function formatTimestamp(): string {
	return new Date().toISOString();
}

function formatMessage(
	level: LogLevel,
	message: string,
	source?: string,
): string {
	const timestamp = formatTimestamp();
	const prefix = source ? `${LOG_PREFIX}[${source}]` : LOG_PREFIX;

	if (isServer && !isProduction) {
		// Colorized output for server development
		return `${COLORS[level]}${EMOJI[level]} ${timestamp} ${prefix} ${message}${COLORS.reset}`;
	}

	return `${EMOJI[level]} ${timestamp} ${prefix} ${message}`;
}

function createLogEntry(
	level: LogLevel,
	message: string,
	context?: LogContext,
	source?: string,
): LogEntry {
	return {
		timestamp: formatTimestamp(),
		level,
		message,
		context,
		source,
	};
}

function shouldLog(level: LogLevel): boolean {
	// In production, only log warnings and errors
	if (isProduction && (level === "debug" || level === "info")) {
		return false;
	}
	return true;
}

function log(
	level: LogLevel,
	message: string,
	context?: LogContext,
	source?: string,
): void {
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

	// In production, send structured logs to monitoring service
	if (isProduction && (level === "warn" || level === "error")) {
		// TODO: Integration with monitoring service (e.g., Sentry, Datadog)
		createLogEntry(level, message, context, source);
		// sendToMonitoring(entry)
	}
}

/**
 * Create a scoped logger for a specific module/service
 */
function createLogger(source: string) {
	return {
		debug: (message: string, context?: LogContext) =>
			log("debug", message, context, source),
		info: (message: string, context?: LogContext) =>
			log("info", message, context, source),
		warn: (message: string, context?: LogContext) =>
			log("warn", message, context, source),
		error: (message: string, context?: LogContext) =>
			log("error", message, context, source),
	};
}

/**
 * Default logger instance (unscoped).
 *
 * @example
 * ```ts
 * import { logger } from "@arkelythex/infrastructure/logger";
 *
 * logger.info("Service started", { port: 3000 });
 * logger.error("Unexpected error", { err: new Error("boom") });
 * ```
 */
export const logger = {
	debug: (message: string, context?: LogContext) =>
		log("debug", message, context),
	info: (message: string, context?: LogContext) =>
		log("info", message, context),
	warn: (message: string, context?: LogContext) =>
		log("warn", message, context),
	error: (message: string, context?: LogContext) =>
		log("error", message, context),

	// Factory for scoped loggers
	create: createLogger,
};

/**
 * Pre-configured scoped loggers for common services/modules.
 *
 * @example
 * ```ts
 * import { loggers } from "@arkelythex/infrastructure/logger";
 *
 * loggers.ai.info("Prompt executed", { promptId: "prompt_123" });
 * loggers.worker.warn("Job retry", { jobId: "job_123", attempt: 2 });
 * ```
 */
export const loggers = {
	queue: createLogger("Queue"),
	redis: createLogger("Redis"),
	ai: createLogger("AI"),
	webhook: createLogger("Webhook"),
	validation: createLogger("Validation"),
	hitl: createLogger("HITL"),
	worker: createLogger("Worker"),
};

export type { LogLevel, LogContext, LogEntry };
