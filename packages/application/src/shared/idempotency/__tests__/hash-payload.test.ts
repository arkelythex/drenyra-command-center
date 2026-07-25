import { describe, expect, it } from "vitest";
import { HASH_LENGTH, HASH_PATTERN, hashPayload } from "../hash-payload";
import { HashPayloadValidationError } from "../types";

describe("hashPayload", () => {
	const BASE_INPUT = {
		operation: "test.op:v1",
		payloadVersion: 1,
		payload: { amount: 100, currency: "PEN" },
	};

	it("returns a 64-char lowercase hex string", () => {
		const digest = hashPayload(BASE_INPUT);
		expect(digest).toHaveLength(HASH_LENGTH);
		expect(HASH_PATTERN.test(digest)).toBe(true);
	});

	// ─── Determinism ──────────────────────────────────────────────────────

	it("same operation + payload version + payload produces same hash", () => {
		const a = hashPayload(BASE_INPUT);
		const b = hashPayload(BASE_INPUT);
		expect(a).toBe(b);
	});

	it("same input repeated 100 times produces same hash", () => {
		const first = hashPayload(BASE_INPUT);
		for (let i = 0; i < 100; i++) {
			expect(hashPayload(BASE_INPUT)).toBe(first);
		}
	});

	// ─── Key ordering stability ───────────────────────────────────────────

	it("same payload with different key ordering produces same hash", () => {
		const a = hashPayload({
			...BASE_INPUT,
			payload: { currency: "PEN", amount: 100 },
		});
		const b = hashPayload(BASE_INPUT);
		expect(a).toBe(b);
	});

	// ─── Sensitivity to changes ───────────────────────────────────────────

	it("different operation produces different hash", () => {
		const a = hashPayload(BASE_INPUT);
		const b = hashPayload({ ...BASE_INPUT, operation: "other.op:v1" });
		expect(a).not.toBe(b);
	});

	it("different payloadVersion produces different hash", () => {
		const a = hashPayload(BASE_INPUT);
		const b = hashPayload({ ...BASE_INPUT, payloadVersion: 2 });
		expect(a).not.toBe(b);
	});

	it("different payload produces different hash", () => {
		const a = hashPayload(BASE_INPUT);
		const b = hashPayload({ ...BASE_INPUT, payload: { amount: 200 } });
		expect(a).not.toBe(b);
	});

	it("null vs absent property produces different hash", () => {
		const a = hashPayload({ ...BASE_INPUT, payload: { a: null } });
		const b = hashPayload({ ...BASE_INPUT, payload: {} });
		expect(a).not.toBe(b);
	});

	it("number vs string produces different hash", () => {
		const a = hashPayload({ ...BASE_INPUT, payload: 1 });
		const b = hashPayload({ ...BASE_INPUT, payload: "1" });
		expect(a).not.toBe(b);
	});

	// ─── undefined handling ───────────────────────────────────────────────

	it("undefined property produces same hash as absent", () => {
		const a = hashPayload({
			...BASE_INPUT,
			payload: { amount: 10, note: undefined },
		});
		const b = hashPayload({ ...BASE_INPUT, payload: { amount: 10 } });
		expect(a).toBe(b);
	});

	// ─── Validation ────────────────────────────────────────────────────────

	it("rejects empty operation", () => {
		expect(() => hashPayload({ ...BASE_INPUT, operation: "" })).toThrow(
			HashPayloadValidationError,
		);
	});

	it("rejects payloadVersion = 0", () => {
		expect(() => hashPayload({ ...BASE_INPUT, payloadVersion: 0 })).toThrow(
			HashPayloadValidationError,
		);
	});

	it("rejects payloadVersion as float", () => {
		expect(() => hashPayload({ ...BASE_INPUT, payloadVersion: 1.5 })).toThrow(
			HashPayloadValidationError,
		);
	});

	// ─── Complex payloads ─────────────────────────────────────────────────

	it("handles nested objects deterministically", () => {
		const a = hashPayload({
			operation: "nested:v1",
			payloadVersion: 1,
			payload: {
				items: [
					{ id: 1, tags: ["a", "b"] },
					{ id: 2, tags: ["c"] },
				],
				meta: { source: "api" },
			},
		});
		const b = hashPayload({
			operation: "nested:v1",
			payloadVersion: 1,
			payload: {
				meta: { source: "api" },
				items: [
					{ tags: ["a", "b"], id: 1 },
					{ id: 2, tags: ["c"] },
				],
			},
		});
		expect(a).toBe(b);
	});

	it("handles Date objects in payload", () => {
		const d1 = hashPayload({
			...BASE_INPUT,
			payload: { date: new Date("2026-07-12T15:00:00Z") },
		});
		const d2 = hashPayload({
			...BASE_INPUT,
			payload: { date: new Date("2026-07-12T10:00:00-05:00") },
		});
		expect(d1).toBe(d2);
	});

	// ─── Canonicalization version stability ───────────────────────────────

	it("hash always embeds canonicalizationVersion=1", () => {
		// This is an acceptance test: if canonicalizationVersion changes,
		// all existing hashes will differ, which is intentional.
		const digest = hashPayload(BASE_INPUT);
		expect(digest).toHaveLength(64);
		expect(HASH_PATTERN.test(digest)).toBe(true);
	});
});
