/**
 * Deterministic payload canonicalization (ADR-009).
 *
 * Produces a stable JSON representation of any serializable value:
 * - Object keys sorted lexicographically
 * - Arrays preserve order
 * - undefined in objects → removed (same as absent)
 * - undefined in arrays → rejected
 * - Date → UTC ISO string via toISOString()
 * - NaN, Infinity → rejected
 * - Circular references → rejected
 * - Class instances (except Date) → rejected
 *
 * Pure primitive with zero external dependencies.
 */

import {
	type CanonicalizationFailureReason,
	PayloadCanonicalizationError,
} from "./types";

type CanonicalValue =
	| string
	| number
	| boolean
	| null
	| CanonicalValue[]
	| { [key: string]: CanonicalValue };

function reject(reason: CanonicalizationFailureReason, msg: string): never {
	throw new PayloadCanonicalizationError(msg, reason);
}

function rejectUnsupported(value: unknown, path: string): never {
	return reject(
		"unsupported-type",
		`${typeof value === "object" ? (value?.constructor?.name ?? typeof value) : typeof value} is not serializable at ${path}`,
	);
}

function canonicalizeNumber(value: number, path: string): number {
	if (!Number.isFinite(value)) {
		reject("non-finite-number", `Non-finite number at ${path}: ${value}`);
	}
	return value;
}

function canonicalizeDate(value: Date, path: string): string {
	if (Number.isNaN(value.getTime())) {
		reject("unsupported-type", `Invalid Date at ${path}`);
	}
	return value.toISOString();
}

function canonicalizeArray(
	value: unknown[],
	path: string,
	seen: WeakSet<object>,
): CanonicalValue[] {
	return value.map((item, index) => {
		if (item === undefined) {
			reject(
				"undefined-in-array",
				`undefined is not allowed in arrays at ${path}[${index}]`,
			);
		}
		return canonicalizePayload(item, `${path}[${index}]`, seen);
	});
}

function canonicalizePlainObject(
	value: Record<string, unknown>,
	path: string,
	seen: WeakSet<object>,
): { [key: string]: CanonicalValue } {
	const keys = Object.keys(value).sort();
	const result: Record<string, CanonicalValue> = {};
	for (const key of keys) {
		const val = value[key];
		if (val !== undefined) {
			result[key] = canonicalizePayload(val, `${path}.${key}`, seen);
		}
	}
	return result;
}

function detectCycleAndVisit(
	value: object,
	path: string,
	seen: WeakSet<object>,
): void {
	if (seen.has(value)) {
		reject("circular-reference", `Circular reference detected at ${path}`);
	}
	seen.add(value);
}

/**
 * Normalize a value for deterministic hashing.
 *
 * Produces a JSON-serializable structure where:
 * - All object keys are sorted
 * - undefined properties are stripped
 * - Dates are converted to UTC ISO strings
 * - Non-serializable or ambiguous values are rejected
 *
 * @param value - The value to canonicalize
 * @param path - Current path for error messages
 * @param seen - WeakSet for circular reference detection
 * @returns A plain JSON-serializable value
 * @throws {PayloadCanonicalizationError} if the value cannot be canonicalized
 */
export function canonicalizePayload(
	value: unknown,
	path: string = "$",
	seen: WeakSet<object> = new WeakSet(),
): CanonicalValue {
	// Null
	if (value === null) return null;
	if (value === undefined) return undefined as unknown as CanonicalValue;

	// Simple primitives
	if (typeof value === "boolean") return value;
	if (typeof value === "string") return value;
	if (typeof value === "number") return canonicalizeNumber(value, path);

	// Rejected primitive types
	if (
		typeof value === "bigint" ||
		typeof value === "symbol" ||
		typeof value === "function"
	) {
		rejectUnsupported(value, path);
	}

	// Objects
	detectCycleAndVisit(value as object, path, seen);

	if (value instanceof Date) return canonicalizeDate(value, path);

	// Reject arbitrary class instances (allow null-prototype objects)
	const ctor = (value as object).constructor;
	if (ctor !== undefined && ctor !== Object && ctor !== Array) {
		rejectUnsupported(value, path);
	}

	if (Array.isArray(value)) return canonicalizeArray(value, path, seen);

	// Plain object
	return canonicalizePlainObject(value as Record<string, unknown>, path, seen);
}

/**
 * Serialize a canonicalized value to a JSON string.
 *
 * Uses JSON.stringify with sorted keys (already guaranteed by canonicalizePayload).
 * This is a thin wrapper that ensures consistent output.
 */
export function serializeCanonical(value: CanonicalValue): string {
	return JSON.stringify(value);
}
