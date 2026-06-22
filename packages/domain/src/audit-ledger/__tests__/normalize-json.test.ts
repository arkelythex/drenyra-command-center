import { describe, it, expect } from "vitest";
import { normalizeJson } from "../normalize-json";

describe("normalizeJson", () => {
	it("should sort object keys alphabetically", () => {
		expect(normalizeJson({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
	});

	it("should handle nested objects recursively", () => {
		expect(normalizeJson({ z: { b: 2, a: 1 } })).toBe(
			'{"z":{"a":1,"b":2}}',
		);
	});

	it("should handle arrays with objects", () => {
		expect(normalizeJson([3, { y: 1, x: 2 }])).toBe('[3,{"x":2,"y":1}]');
	});

	it("should return 'null' for null", () => {
		expect(normalizeJson(null)).toBe("null");
	});

	it("should return 'null' for undefined", () => {
		expect(normalizeJson(undefined)).toBe("null");
	});

	it("should serialize primitive numbers", () => {
		expect(normalizeJson(42)).toBe("42");
	});

	it("should serialize primitive strings", () => {
		expect(normalizeJson("hello")).toBe('"hello"');
	});

	it("should be deterministic across calls for the same data", () => {
		const data = { c: 3, a: { n: 2, m: 1 }, b: [4, { f: 6, e: 5 }] };
		const first = normalizeJson(data);
		const second = normalizeJson(data);
		expect(first).toBe(second);
	});

	it("should handle empty object", () => {
		expect(normalizeJson({})).toBe("{}");
	});

	it("should handle empty array", () => {
		expect(normalizeJson([])).toBe("[]");
	});

	it("should handle true/false booleans", () => {
		expect(normalizeJson(true)).toBe("true");
		expect(normalizeJson(false)).toBe("false");
	});
});
