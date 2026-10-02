import { describe, expect, it } from "vitest";
import { countByDirectory, findRegressions } from "../typecheck-ratchet";

describe("typecheck ratchet", () => {
	it("groups errors by directory", () => {
		const out = [
			"apps/api/src/a.ts(1,2): error TS2532: x",
			"apps/api/src/b/c.ts(3,4): error TS18048: y",
			"packages/pi/src/d.ts(5,6): error TS2345: z",
		].join("\n");
		expect(countByDirectory(out)).toEqual({
			"apps/api/src": 2,
			"packages/pi/src": 1,
		});
	});

	it("flags only increases", () => {
		expect(findRegressions({ a: 2, b: 1 }, { a: 3, b: 0 })).toEqual([
			"b: 0 -> 1",
		]);
		expect(findRegressions({ a: 1 }, { a: 1 })).toEqual([]);
	});
});
