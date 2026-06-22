/**
 * PromptVersion Value Object Tests
 *
 * Tests for semantic versioning of AI prompts
 */

import { describe, expect, it } from "vitest";
import { PromptVersion } from "../PromptVersion";

describe("PromptVersion", () => {
	describe("parse", () => {
		it("should parse valid semver string", () => {
			const version = PromptVersion.parse("1.2.3");

			expect(version.getMajor()).toBe(1);
			expect(version.getMinor()).toBe(2);
			expect(version.getPatch()).toBe(3);
			expect(version.toString()).toBe("1.2.3");
		});

		it("should parse version with zeros", () => {
			const version = PromptVersion.parse("0.0.1");

			expect(version.getMajor()).toBe(0);
			expect(version.getMinor()).toBe(0);
			expect(version.getPatch()).toBe(1);
		});

		it("should parse high version numbers", () => {
			const version = PromptVersion.parse("100.200.300");

			expect(version.getMajor()).toBe(100);
			expect(version.getMinor()).toBe(200);
			expect(version.getPatch()).toBe(300);
		});

		it("should throw for invalid format - missing parts", () => {
			expect(() => PromptVersion.parse("1.2")).toThrow(
				"Invalid version format",
			);
			expect(() => PromptVersion.parse("1")).toThrow("Invalid version format");
		});

		it("should throw for invalid format - letters", () => {
			expect(() => PromptVersion.parse("1.2.a")).toThrow(
				"Invalid version format",
			);
			expect(() => PromptVersion.parse("a.b.c")).toThrow(
				"Invalid version format",
			);
		});

		it("should throw for invalid format - extra parts", () => {
			expect(() => PromptVersion.parse("1.2.3.4")).toThrow(
				"Invalid version format",
			);
		});

		it("should throw for empty string", () => {
			expect(() => PromptVersion.parse("")).toThrow("Invalid version format");
		});
	});

	describe("initial", () => {
		it("should create version 1.0.0", () => {
			const version = PromptVersion.initial();

			expect(version.toString()).toBe("1.0.0");
			expect(version.getMajor()).toBe(1);
			expect(version.getMinor()).toBe(0);
			expect(version.getPatch()).toBe(0);
		});
	});

	describe("create", () => {
		it("should create version from components", () => {
			const version = PromptVersion.create(2, 5, 10);

			expect(version.getMajor()).toBe(2);
			expect(version.getMinor()).toBe(5);
			expect(version.getPatch()).toBe(10);
		});

		it("should throw for negative major", () => {
			expect(() => PromptVersion.create(-1, 0, 0)).toThrow(
				"Version components must be non-negative",
			);
		});

		it("should throw for negative minor", () => {
			expect(() => PromptVersion.create(1, -1, 0)).toThrow(
				"Version components must be non-negative",
			);
		});

		it("should throw for negative patch", () => {
			expect(() => PromptVersion.create(1, 0, -1)).toThrow(
				"Version components must be non-negative",
			);
		});
	});

	describe("increment methods", () => {
		it("incrementPatch should only increment patch", () => {
			const v1 = PromptVersion.parse("1.2.3");
			const v2 = v1.incrementPatch();

			expect(v2.toString()).toBe("1.2.4");
			// Original should be unchanged (immutability)
			expect(v1.toString()).toBe("1.2.3");
		});

		it("incrementMinor should increment minor and reset patch", () => {
			const v1 = PromptVersion.parse("1.2.5");
			const v2 = v1.incrementMinor();

			expect(v2.toString()).toBe("1.3.0");
		});

		it("incrementMajor should increment major and reset minor/patch", () => {
			const v1 = PromptVersion.parse("1.5.10");
			const v2 = v1.incrementMajor();

			expect(v2.toString()).toBe("2.0.0");
		});

		it("should chain increments", () => {
			const v1 = PromptVersion.initial();
			const v2 = v1
				.incrementPatch()
				.incrementPatch()
				.incrementMinor()
				.incrementMajor();

			expect(v2.toString()).toBe("2.0.0");
		});
	});

	describe("isNewerThan", () => {
		it("should compare major versions", () => {
			const v1 = PromptVersion.parse("2.0.0");
			const v2 = PromptVersion.parse("1.9.9");

			expect(v1.isNewerThan(v2)).toBe(true);
			expect(v2.isNewerThan(v1)).toBe(false);
		});

		it("should compare minor versions when major is equal", () => {
			const v1 = PromptVersion.parse("1.3.0");
			const v2 = PromptVersion.parse("1.2.9");

			expect(v1.isNewerThan(v2)).toBe(true);
			expect(v2.isNewerThan(v1)).toBe(false);
		});

		it("should compare patch versions when major and minor are equal", () => {
			const v1 = PromptVersion.parse("1.2.4");
			const v2 = PromptVersion.parse("1.2.3");

			expect(v1.isNewerThan(v2)).toBe(true);
			expect(v2.isNewerThan(v1)).toBe(false);
		});

		it("should return false for equal versions", () => {
			const v1 = PromptVersion.parse("1.2.3");
			const v2 = PromptVersion.parse("1.2.3");

			expect(v1.isNewerThan(v2)).toBe(false);
			expect(v2.isNewerThan(v1)).toBe(false);
		});
	});

	describe("isOlderThan", () => {
		it("should be inverse of isNewerThan", () => {
			const v1 = PromptVersion.parse("1.0.0");
			const v2 = PromptVersion.parse("2.0.0");

			expect(v1.isOlderThan(v2)).toBe(true);
			expect(v2.isOlderThan(v1)).toBe(false);
		});
	});

	describe("equals", () => {
		it("should return true for identical versions", () => {
			const v1 = PromptVersion.parse("1.2.3");
			const v2 = PromptVersion.parse("1.2.3");

			expect(v1.equals(v2)).toBe(true);
		});

		it("should return false for different versions", () => {
			const v1 = PromptVersion.parse("1.2.3");
			const v2 = PromptVersion.parse("1.2.4");

			expect(v1.equals(v2)).toBe(false);
		});
	});

	describe("compareTo", () => {
		it("should return -1 for older version", () => {
			const v1 = PromptVersion.parse("1.0.0");
			const v2 = PromptVersion.parse("2.0.0");

			expect(v1.compareTo(v2)).toBe(-1);
		});

		it("should return 0 for equal versions", () => {
			const v1 = PromptVersion.parse("1.2.3");
			const v2 = PromptVersion.parse("1.2.3");

			expect(v1.compareTo(v2)).toBe(0);
		});

		it("should return 1 for newer version", () => {
			const v1 = PromptVersion.parse("2.0.0");
			const v2 = PromptVersion.parse("1.0.0");

			expect(v1.compareTo(v2)).toBe(1);
		});

		it("should be usable for sorting", () => {
			const versions = [
				PromptVersion.parse("2.0.0"),
				PromptVersion.parse("1.1.0"),
				PromptVersion.parse("1.0.1"),
				PromptVersion.parse("3.0.0"),
			];

			const sorted = [...versions].sort((a, b) => a.compareTo(b));

			expect(sorted.map((v) => v.toString())).toEqual([
				"1.0.1",
				"1.1.0",
				"2.0.0",
				"3.0.0",
			]);
		});
	});

	describe("toJSON", () => {
		it("should return string representation", () => {
			const version = PromptVersion.parse("1.2.3");

			expect(version.toJSON()).toBe("1.2.3");
		});

		it("should be JSON.stringify compatible", () => {
			const version = PromptVersion.parse("1.2.3");

			expect(JSON.stringify(version)).toBe('"1.2.3"');
		});
	});

	describe("immutability", () => {
		it("should not allow property modification", () => {
			const version = PromptVersion.parse("1.2.3");

			// Attempting to modify should throw in strict mode or be ignored
			expect(() => {
				(version as unknown as Record<string, number>).major = 999;
			}).toThrow();
		});
	});
});
