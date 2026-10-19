import { describe, expect, it } from "vitest";
import { firstOf, lastOf } from "../non-empty";

describe("firstOf / lastOf", () => {
	it("return the first and last element", () => {
		expect(firstOf([1, 2, 3], "numbers")).toBe(1);
		expect(lastOf([1, 2, 3], "numbers")).toBe(3);
	});

	it("work on a single element", () => {
		expect(firstOf(["a"], "x")).toBe("a");
		expect(lastOf(["a"], "x")).toBe("a");
	});

	it("keep falsy elements (0, empty string, false) instead of treating them as missing", () => {
		expect(firstOf([0, 1], "n")).toBe(0);
		expect(lastOf([1, 0], "n")).toBe(0);
		expect(firstOf(["", "a"], "s")).toBe("");
		expect(lastOf([true, false], "b")).toBe(false);
	});

	it("name what was empty in the error", () => {
		expect(() => firstOf([], "candidate models")).toThrow(
			"candidate models must not be empty",
		);
		expect(() => lastOf([], "events")).toThrow("events must not be empty");
	});

	it("accepts readonly arrays", () => {
		const frozen: readonly number[] = Object.freeze([5, 6]);
		expect(firstOf(frozen, "n")).toBe(5);
		expect(lastOf(frozen, "n")).toBe(6);
	});
});
