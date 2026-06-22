import { createHash } from "node:crypto";

const MAX_DEPTH = 3;
const MAX_KEYS = 16;
const MAX_ARRAY_ITEMS = 10;
const MAX_STRING_LENGTH = 160;
const REDACTED_VALUE = "[REDACTED]";
const TRUNCATED_VALUE = "[TRUNCATED]";

const SENSITIVE_KEYWORDS = [
	"password",
	"secret",
	"token",
	"authorization",
	"cookie",
	"apikey",
	"api_key",
	"accountnumber",
	"account_number",
	"cardnumber",
	"card_number",
	"dni",
	"ruc",
	"email",
	"phone",
	"documentnumber",
	"document_number",
] as const;

export interface SanitizedAiObservationPayload {
	preview: unknown;
	hash: string;
	redacted: boolean;
}

function normalizeKey(key: string): string {
	return key
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "");
}

function isSensitiveKey(key: string): boolean {
	const normalized = normalizeKey(key);
	return SENSITIVE_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function sanitizeString(value: string): string {
	const trimmed = value.trim();
	if (trimmed.length <= MAX_STRING_LENGTH) {
		return trimmed;
	}

	return `${trimmed.slice(0, MAX_STRING_LENGTH)} ${TRUNCATED_VALUE}`;
}

function sanitizeInternal(
	value: unknown,
	depth: number,
): { value: unknown; redacted: boolean } {
	if (value === null || typeof value === "boolean") {
		return { value, redacted: false };
	}

	if (typeof value === "number") {
		return { value: Number.isFinite(value) ? value : null, redacted: false };
	}

	if (typeof value === "string") {
		return { value: sanitizeString(value), redacted: false };
	}

	if (typeof value === "bigint") {
		return { value: value.toString(), redacted: false };
	}

	if (Array.isArray(value)) {
		const sanitizedItems = value
			.slice(0, MAX_ARRAY_ITEMS)
			.map((item) => sanitizeInternal(item, depth + 1));

		return {
			value: sanitizedItems.map((item) => item.value),
			redacted:
				value.length > MAX_ARRAY_ITEMS ||
				sanitizedItems.some((item) => item.redacted),
		};
	}

	if (typeof value === "object") {
		if (!value || depth >= MAX_DEPTH) {
			return { value: "[object]", redacted: true };
		}

		const entries = Object.entries(value).slice(0, MAX_KEYS);
		const sanitizedEntries = entries.map(([key, item]) => {
			if (isSensitiveKey(key)) {
				return { key, value: REDACTED_VALUE, redacted: true };
			}

			const sanitized = sanitizeInternal(item, depth + 1);
			return { key, value: sanitized.value, redacted: sanitized.redacted };
		});

		return {
			value: Object.fromEntries(
				sanitizedEntries.map((entry) => [entry.key, entry.value]),
			),
			redacted:
				Object.keys(value).length > MAX_KEYS ||
				sanitizedEntries.some((entry) => entry.redacted),
		};
	}

	return { value: String(value), redacted: false };
}

export function sanitizeAiObservationPayload(value: unknown): unknown {
	return sanitizeInternal(value, 0).value;
}

export function hashAiObservationPayload(value: unknown): string {
	const normalizedValue = sanitizeAiObservationPayload(value);
	return createHash("sha256")
		.update(JSON.stringify(normalizedValue) ?? "null")
		.digest("hex");
}

export function summarizeAiObservationPayload(
	value: unknown,
): SanitizedAiObservationPayload {
	const sanitized = sanitizeInternal(value, 0);
	return {
		preview: sanitized.value,
		hash: hashAiObservationPayload(sanitized.value),
		redacted: sanitized.redacted,
	};
}
