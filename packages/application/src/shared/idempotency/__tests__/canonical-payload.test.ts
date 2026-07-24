import { describe, expect, it } from "vitest";
import { canonicalizePayload, serializeCanonical } from "../canonical-payload";
import { PayloadCanonicalizationError } from "../types";

describe("canonicalizePayload", () => {
	// ─── Primitives ────────────────────────────────────────────────────────

	it("passes through null", () => {
		expect(canonicalizePayload(null)).toBe(null);
	});

	it("passes through booleans", () => {
		expect(canonicalizePayload(true)).toBe(true);
		expect(canonicalizePayload(false)).toBe(false);
	});

	it("passes through strings", () => {
		expect(canonicalizePayload("hello")).toBe("hello");
		expect(canonicalizePayload("")).toBe("");
	});

	it("passes through finite numbers", () => {
		expect(canonicalizePayload(0)).toBe(0);
		expect(canonicalizePayload(42)).toBe(42);
		expect(canonicalizePayload(-1.5)).toBe(-1.5);
	});

	it("rejects NaN", () => {
		expect(() => canonicalizePayload(NaN)).toThrow(
			PayloadCanonicalizationError,
		);
	});

	it("rejects Infinity and -Infinity", () => {
		expect(() => canonicalizePayload(Infinity)).toThrow(
			PayloadCanonicalizationError,
		);
		expect(() => canonicalizePayload(-Infinity)).toThrow(
			PayloadCanonicalizationError,
		);
	});

	// ─── Rejected types ────────────────────────────────────────────────────

	it("rejects BigInt", () => {
		expect(() => canonicalizePayload(BigInt(42))).toThrow(
			PayloadCanonicalizationError,
		);
	});

	it("rejects Symbol", () => {
		expect(() => canonicalizePayload(Symbol("foo"))).toThrow(
			PayloadCanonicalizationError,
		);
	});

	it("rejects functions", () => {
		expect(() => canonicalizePayload(() => {})).toThrow(
			PayloadCanonicalizationError,
		);
	});

	// ─── undefined ─────────────────────────────────────────────────────────

	it("removes undefined properties from objects", () => {
		const result = canonicalizePayload({ amount: 10, note: undefined });
		expect(result).toEqual({ amount: 10 });
	});

	it("treats undefined property same as absent", () => {
		const a = canonicalizePayload({ amount: 10, note: undefined });
		const b = canonicalizePayload({ amount: 10 });
		expect(a).toEqual(b);
	});

	it("rejects undefined inside arrays", () => {
		expect(() => canonicalizePayload([10, undefined])).toThrow(
			PayloadCanonicalizationError,
		);
	});

	// ─── Date ──────────────────────────────────────────────────────────────

	it("converts Date to UTC ISO string", () => {
		const date = new Date("2026-07-12T15:00:00Z");
		expect(canonicalizePayload(date)).toBe("2026-07-12T15:00:00.000Z");
	});

	it("produces same canonical form for equivalent Dates", () => {
		const d1 = new Date("2026-07-12T15:00:00Z");
		const d2 = new Date("2026-07-12T10:00:00-05:00");
		expect(canonicalizePayload(d1)).toBe(canonicalizePayload(d2));
	});

	it("rejects invalid Date", () => {
		expect(() => canonicalizePayload(new Date(NaN))).toThrow(
			PayloadCanonicalizationError,
		);
	});

	// ─── Objects with key ordering ─────────────────────────────────────────

	it("sorts object keys lexicographically", () => {
		const result = canonicalizePayload({ z: 1, a: 2, m: 3 });
		expect(JSON.stringify(result)).toBe('{"a":2,"m":3,"z":1}');
	});

	it("nested objects with different key order produce same canonical form", () => {
		const a = canonicalizePayload({ b: { y: 1, x: 2 }, a: 3 });
		const b = canonicalizePayload({ a: 3, b: { x: 2, y: 1 } });
		expect(a).toEqual(b);
	});

	// ─── Arrays ────────────────────────────────────────────────────────────

	it("preserves array order", () => {
		const result = canonicalizePayload([3, 1, 2]);
		expect(result).toEqual([3, 1, 2]);
	});

	it("arrays with different order produce different canonical forms", () => {
		const a = serializeCanonical(canonicalizePayload([1, 2, 3]));
		const b = serializeCanonical(canonicalizePayload([3, 2, 1]));
		expect(a).not.toBe(b);
	});

	it("handles nested arrays", () => {
		const result = canonicalizePayload([1, [2, 3]]);
		expect(result).toEqual([1, [2, 3]]);
	});

	// ─── null vs absent ────────────────────────────────────────────────────

	it("null property produces different canonical form than absent", () => {
		const a = canonicalizePayload({ a: null });
		const b = canonicalizePayload({});
		expect(a).not.toEqual(b);
	});

	// ─── Type sensitivity ──────────────────────────────────────────────────

	it("number 1 and string '1' produce different canonical forms", () => {
		const a = canonicalizePayload(1);
		const b = canonicalizePayload("1");
		expect(a).not.toEqual(b);
	});

	// ─── Circular references ───────────────────────────────────────────────

	it("rejects circular references in objects", () => {
		const obj: Record<string, unknown> = { a: 1 };
		obj.self = obj;
		expect(() => canonicalizePayload(obj)).toThrow(
			PayloadCanonicalizationError,
		);
	});

	it("rejects circular references in arrays", () => {
		const arr: unknown[] = [1, 2];
		arr.push(arr);
		expect(() => canonicalizePayload(arr)).toThrow(
			PayloadCanonicalizationError,
		);
	});

	// ─── Class instances ───────────────────────────────────────────────────

	it("rejects arbitrary class instances", () => {
		class MyClass {
			constructor(public value: number) {}
		}
		expect(() => canonicalizePayload(new MyClass(42))).toThrow(
			PayloadCanonicalizationError,
		);
	});

	it("handles plain objects from Object.create(null)", () => {
		const obj = Object.create(null);
		obj.a = 1;
		obj.b = 2;
		const result = canonicalizePayload(obj);
		expect(result).toEqual({ a: 1, b: 2 });
	});

	// ─── Unicode stability ─────────────────────────────────────────────────

	it("preserves Unicode strings (no normalization)", () => {
		const result = canonicalizePayload("café ñoño");
		expect(result).toBe("café ñoño");
	});

	// ─── Empty containers ──────────────────────────────────────────────────

	it("canonicalizes empty object", () => {
		expect(canonicalizePayload({})).toEqual({});
	});

	it("canonicalizes empty array", () => {
		expect(canonicalizePayload([])).toEqual([]);
	});

	// ─── Deeply nested ─────────────────────────────────────────────────────

	it("canonicalizes deeply nested structures deterministically", () => {
		const input = {
			level1: {
				level2: {
					level3: {
						values: [1, 2, { deep: true }],
						date: new Date("2026-01-01Z"),
					},
				},
			},
		};
		const result = serializeCanonical(canonicalizePayload(input));
		expect(result).toContain("2026-01-01T00:00:00.000Z");
		expect(result).toContain("deep");
		expect(result).toContain("level1");
		expect(result).toContain("level2");
		expect(result).toContain("level3");
		expect(result).toContain('[1,2,{"deep":true}]');
	});

	// ─── Determinism ───────────────────────────────────────────────────────

	it("same input called repeatedly produces same result", () => {
		const input = { a: [1, 2, { b: 3 }], c: new Date("2026-01-01Z") };
		const results = Array.from({ length: 100 }, () =>
			serializeCanonical(canonicalizePayload(input)),
		);
		const first = results[0];
		for (const r of results) {
			expect(r).toBe(first);
		}
	});
});
