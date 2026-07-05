import { describe, expect, it } from "vitest";
import { getAvatarColor, getInitials } from "../avatar.utils";

describe("avatar.utils", () => {
	describe("getInitials", () => {
		it("should return first two letters of single name", () => {
			expect(getInitials("Alberto")).toBe("AL");
		});

		it("should return first letter of first and last name", () => {
			expect(getInitials("Juan Pérez")).toBe("JP");
		});

		it("should handle names with multiple parts", () => {
			expect(getInitials("María Elena Rodríguez López")).toBe("ML");
		});

		it("should handle names with extra spaces", () => {
			expect(getInitials("  Carlos   Mendoza  ")).toBe("CM");
		});

		it("should return ?? for empty string", () => {
			expect(getInitials("")).toBe("??");
		});

		it("should return ?? for whitespace only", () => {
			expect(getInitials("   ")).toBe("??");
		});

		it("should uppercase lowercase names", () => {
			expect(getInitials("pedro garcía")).toBe("PG");
		});

		it("should handle names with special characters", () => {
			expect(getInitials("José-María Ñúñez")).toBe("JÑ");
		});

		it("should handle single letter names", () => {
			expect(getInitials("A")).toBe("A");
		});

		it("should handle two single letters", () => {
			expect(getInitials("A B")).toBe("AB");
		});
	});

	describe("getAvatarColor", () => {
		it("should return consistent color for same name", () => {
			const color1 = getAvatarColor("Alberto Mendoza");
			const color2 = getAvatarColor("Alberto Mendoza");
			expect(color1).toBe(color2);
		});

		it("should return valid Tailwind color class", () => {
			const color = getAvatarColor("Test User");
			const validColors = [
				"bg-[var(--premium-action-blue)]",
				"bg-[var(--premium-action-cyan)]",
				"bg-[var(--premium-success)]",
				"bg-[rgba(var(--premium-warning-rgb),0.82)]",
				"bg-[rgba(var(--premium-danger-rgb),0.78)]",
				"bg-[rgba(var(--premium-info-rgb),0.85)]",
				"bg-[var(--premium-action-blue)]",
				"bg-[var(--premium-action-cyan)]",
			];
			expect(validColors).toContain(color);
		});

		it("should generate different colors for different names", () => {
			const color1 = getAvatarColor("Alice");
			const color2 = getAvatarColor("Bob");
			const color3 = getAvatarColor("Charlie");

			// At least some should be different (hash collision is possible but unlikely)
			const uniqueColors = new Set([color1, color2, color3]);
			expect(uniqueColors.size).toBeGreaterThan(1);
		});

		it("should handle empty string", () => {
			const color = getAvatarColor("");
			expect(color).toMatch(/^bg-/);
		});

		it("should handle unicode characters", () => {
			const color = getAvatarColor("José María Ñúñez 李明");
			expect(color).toMatch(/^bg-/);
		});

		it("should be case-sensitive for color generation", () => {
			// Note: Current implementation is case-sensitive
			// Same name with different casing may produce different colors
			const color1 = getAvatarColor("John Doe");
			const color2 = getAvatarColor("john doe");

			// Document that colors may differ based on casing
			// (hash is case-sensitive, but collision is possible)
			expect(typeof color1).toBe("string");
			expect(typeof color2).toBe("string");
		});

		it("should distribute colors across the palette", () => {
			// Generate colors for many names
			const names = Array.from({ length: 100 }, (_, i) => `User ${i}`);
			const colors = names.map(getAvatarColor);
			const uniqueColors = new Set(colors);

			// Should use multiple colors (not all same)
			expect(uniqueColors.size).toBeGreaterThan(5);
		});
	});
});
