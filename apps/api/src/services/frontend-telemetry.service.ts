import { randomUUID } from "node:crypto";
import { db } from "@drenyra/persistence/client";
import { frontendTelemetryEvents } from "@drenyra/persistence/schema";
import { logger } from "../lib/logger";

export type FrontendTelemetryKind =
	| "error"
	| "web-vital"
	| "event"
	| "pageview";
export type FrontendTelemetryRating = "good" | "needs-improvement" | "poor";

export interface FrontendTelemetryInput {
	kind: FrontendTelemetryKind;
	name?: string;
	path?: string;
	value?: number;
	rating?: FrontendTelemetryRating;
	message?: string;
	stack?: string;
	context?: Record<string, unknown>;
	timestamp: string;
	userAgent?: string | null;
	ipAddress?: string | null;
}

export interface StoredFrontendTelemetryEvent {
	id: string;
	kind: FrontendTelemetryKind;
	name?: string;
	path?: string;
	value?: number;
	rating?: FrontendTelemetryRating;
	message?: string;
	stack?: string;
	context?: Record<string, unknown>;
	timestamp: string;
	receivedAt: string;
	userAgent?: string | null;
	ipAddress?: string | null;
}

const MAX_EVENTS = 1_000;
const MAX_NAME_LENGTH = 120;
const MAX_PATH_LENGTH = 300;
const MAX_MESSAGE_LENGTH = 1_000;
const MAX_STACK_LENGTH = 8_000;
const MAX_CONTEXT_KEYS = 30;
const MAX_CONTEXT_DEPTH = 2;
const MAX_ARRAY_ITEMS = 20;
const MAX_CONTEXT_STRING_LENGTH = 300;

const events: StoredFrontendTelemetryEvent[] = [];
const counters: Record<FrontendTelemetryKind, number> = {
	error: 0,
	"web-vital": 0,
	event: 0,
	pageview: 0,
};
let persistedTotal = 0;
let persistErrors = 0;

function parseBooleanEnv(
	value: string | undefined,
	defaultValue: boolean,
): boolean {
	if (typeof value !== "string") return defaultValue;
	const normalized = value.trim().toLowerCase();
	return normalized === "1" || normalized === "true" || normalized === "yes";
}

const dbWriteEnabled = parseBooleanEnv(
	process.env.FRONTEND_TELEMETRY_DB_ENABLED,
	process.env.VITEST === "true" ? false : true,
);

function sanitizeString(value: unknown, maxLength: number): string | undefined {
	if (typeof value !== "string") return undefined;
	const trimmed = value.trim();
	if (!trimmed) return undefined;
	return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function sanitizeNumber(value: unknown): number | undefined {
	if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
	return value;
}

function sanitizeUnknown(value: unknown, depth = 0): unknown {
	if (value === null || typeof value === "boolean") return value;

	if (typeof value === "number") {
		return Number.isFinite(value) ? value : null;
	}

	if (typeof value === "string") {
		return sanitizeString(value, MAX_CONTEXT_STRING_LENGTH) ?? "";
	}

	if (Array.isArray(value)) {
		return value
			.slice(0, MAX_ARRAY_ITEMS)
			.map((item) => sanitizeUnknown(item, depth + 1));
	}

	if (typeof value === "object") {
		if (depth >= MAX_CONTEXT_DEPTH || !value) return "[object]";
		const entries = Object.entries(value).slice(0, MAX_CONTEXT_KEYS);
		const sanitized = entries.map(([key, item]) => [
			sanitizeString(key, 64) ?? key.slice(0, 64),
			sanitizeUnknown(item, depth + 1),
		]);
		return Object.fromEntries(sanitized);
	}

	return String(value);
}

function sanitizeContext(
	context: unknown,
): Record<string, unknown> | undefined {
	if (!context || typeof context !== "object" || Array.isArray(context))
		return undefined;

	const entries = Object.entries(context).slice(0, MAX_CONTEXT_KEYS);
	const sanitized = entries.map(([key, value]) => [
		sanitizeString(key, 64) ?? key.slice(0, 64),
		sanitizeUnknown(value),
	]);
	return Object.fromEntries(sanitized);
}

function sanitizeTimestamp(timestamp: unknown): string {
	if (typeof timestamp !== "string") return new Date().toISOString();
	const candidate = new Date(timestamp);
	return Number.isNaN(candidate.getTime())
		? new Date().toISOString()
		: candidate.toISOString();
}

function createEntry(
	input: FrontendTelemetryInput,
): StoredFrontendTelemetryEvent {
	return {
		id: randomUUID(),
		kind: input.kind,
		name: sanitizeString(input.name, MAX_NAME_LENGTH),
		path: sanitizeString(input.path, MAX_PATH_LENGTH),
		value: sanitizeNumber(input.value),
		rating: input.rating,
		message: sanitizeString(input.message, MAX_MESSAGE_LENGTH),
		stack: sanitizeString(input.stack, MAX_STACK_LENGTH),
		context: sanitizeContext(input.context),
		timestamp: sanitizeTimestamp(input.timestamp),
		receivedAt: new Date().toISOString(),
		userAgent: sanitizeString(input.userAgent, 300) ?? null,
		ipAddress: sanitizeString(input.ipAddress, 120) ?? null,
	};
}

function logTelemetry(entry: StoredFrontendTelemetryEvent): void {
	const base = {
		telemetry: {
			id: entry.id,
			kind: entry.kind,
			name: entry.name,
			path: entry.path,
			value: entry.value,
			rating: entry.rating,
			timestamp: entry.timestamp,
			receivedAt: entry.receivedAt,
			ipAddress: entry.ipAddress,
			hasContext: Boolean(entry.context),
		},
	};

	if (entry.kind === "error") {
		logger.warn(
			{ ...base, message: entry.message },
			"Frontend telemetry error event captured",
		);
		return;
	}

	logger.info(base, "Frontend telemetry event captured");
}

async function persistTelemetryEvent(
	entry: StoredFrontendTelemetryEvent,
): Promise<boolean> {
	if (!dbWriteEnabled) return false;

	try {
		await db.insert(frontendTelemetryEvents).values({
			id: entry.id,
			kind: entry.kind,
			name: entry.name,
			path: entry.path,
			value:
				typeof entry.value === "number" && Number.isFinite(entry.value)
					? entry.value.toFixed(4)
					: null,
			rating: entry.rating,
			message: entry.message,
			stack: entry.stack,
			context: entry.context,
			eventTimestamp: new Date(entry.timestamp),
			receivedAt: new Date(entry.receivedAt),
			userAgent: entry.userAgent,
			ipAddress: entry.ipAddress,
		});
		persistedTotal += 1;
		return true;
	} catch (error: unknown) {
		persistErrors += 1;
		logger.warn(
			{
				error: error instanceof Error ? error.message : String(error),
				telemetryId: entry.id,
				kind: entry.kind,
			},
			"Frontend telemetry persistence failed; event kept in memory buffer",
		);
		return false;
	}
}

export const FrontendTelemetryService = {
	async record(
		input: FrontendTelemetryInput,
	): Promise<StoredFrontendTelemetryEvent> {
		const entry = createEntry(input);
		counters[entry.kind] += 1;
		events.push(entry);

		if (events.length > MAX_EVENTS) {
			events.shift();
		}

		logTelemetry(entry);
		await persistTelemetryEvent(entry);
		return entry;
	},

	getSummary() {
		return {
			total: events.length,
			counters: { ...counters },
			persistedTotal,
			persistErrors,
			dbWriteEnabled,
			lastReceivedAt:
				events.length > 0 ? events[events.length - 1]?.receivedAt : null,
			bufferSize: MAX_EVENTS,
		};
	},

	getRecent(limit = 20): StoredFrontendTelemetryEvent[] {
		const safeLimit = Math.min(Math.max(limit, 1), 200);
		return [...events].slice(-safeLimit).reverse();
	},

	resetForTests() {
		events.length = 0;
		counters.error = 0;
		counters["web-vital"] = 0;
		counters.event = 0;
		counters.pageview = 0;
		persistedTotal = 0;
		persistErrors = 0;
	},
};
