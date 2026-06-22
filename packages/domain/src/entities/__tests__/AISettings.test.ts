/**
 * AISettings Entity Tests
 */

import { describe, expect, it } from "vitest";
import { AI_SETTINGS_MAX_CHARS, AISettings } from "../AISettings";

describe("AISettings Entity", () => {
	const validProps = {
		id: 1,
		userId: "user_123",
		customSystemIndicator: "Always respond in Spanish.",
		isEnabled: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	describe("create", () => {
		it("should create a valid AISettings instance", () => {
			const settings = AISettings.create(validProps);

			expect(settings.id).toBe(validProps.id);
			expect(settings.userId).toBe(validProps.userId);
			expect(settings.customSystemIndicator).toBe(
				validProps.customSystemIndicator,
			);
			expect(settings.isEnabled).toBe(true);
		});

		it("should throw error if userId is empty", () => {
			expect(() => AISettings.create({ ...validProps, userId: "" })).toThrow(
				"El ID de usuario es requerido",
			);
		});

		it("should throw error if userId is whitespace only", () => {
			expect(() => AISettings.create({ ...validProps, userId: "   " })).toThrow(
				"El ID de usuario es requerido",
			);
		});

		it("should throw error if customSystemIndicator exceeds max length", () => {
			const longIndicator = "a".repeat(AI_SETTINGS_MAX_CHARS + 1);
			expect(() =>
				AISettings.create({
					...validProps,
					customSystemIndicator: longIndicator,
				}),
			).toThrow(
				`El indicador del sistema no puede exceder ${AI_SETTINGS_MAX_CHARS} caracteres`,
			);
		});

		it("should allow customSystemIndicator at max length", () => {
			const maxIndicator = "a".repeat(AI_SETTINGS_MAX_CHARS);
			const settings = AISettings.create({
				...validProps,
				customSystemIndicator: maxIndicator,
			});
			expect(settings.customSystemIndicator?.length).toBe(
				AI_SETTINGS_MAX_CHARS,
			);
		});

		it("should allow null customSystemIndicator", () => {
			const settings = AISettings.create({
				...validProps,
				customSystemIndicator: null,
			});
			expect(settings.customSystemIndicator).toBeNull();
		});
	});

	describe("createNew", () => {
		it("should create new settings with defaults", () => {
			const settings = AISettings.createNew("user_456");

			expect(settings.userId).toBe("user_456");
			expect(settings.customSystemIndicator).toBeNull();
			expect(settings.isEnabled).toBe(true);
			expect(settings.id).toBe(0);
		});

		it("should create new settings with custom indicator", () => {
			const settings = AISettings.createNew(
				"user_456",
				"Custom instruction",
				false,
			);

			expect(settings.customSystemIndicator).toBe("Custom instruction");
			expect(settings.isEnabled).toBe(false);
		});

		it("should trim whitespace from custom indicator", () => {
			const settings = AISettings.createNew("user_456", "  trimmed  ");
			expect(settings.customSystemIndicator).toBe("trimmed");
		});
	});

	describe("setCustomSystemIndicator", () => {
		it("should update the custom indicator", () => {
			const settings = AISettings.create(validProps);
			const updated = settings.setCustomSystemIndicator("New instruction");

			expect(updated.customSystemIndicator).toBe("New instruction");
			expect(updated.updatedAt).not.toBe(settings.updatedAt);
		});

		it("should trim whitespace", () => {
			const settings = AISettings.create(validProps);
			const updated = settings.setCustomSystemIndicator("  trimmed  ");

			expect(updated.customSystemIndicator).toBe("trimmed");
		});

		it("should set to null for empty string", () => {
			const settings = AISettings.create(validProps);
			const updated = settings.setCustomSystemIndicator("");

			expect(updated.customSystemIndicator).toBeNull();
		});

		it("should throw error for exceeding max length", () => {
			const settings = AISettings.create(validProps);
			const longIndicator = "a".repeat(AI_SETTINGS_MAX_CHARS + 1);

			expect(() => settings.setCustomSystemIndicator(longIndicator)).toThrow(
				`El indicador del sistema no puede exceder ${AI_SETTINGS_MAX_CHARS} caracteres`,
			);
		});
	});

	describe("enable/disable", () => {
		it("should enable a disabled setting", () => {
			const settings = AISettings.create({ ...validProps, isEnabled: false });
			const enabled = settings.enable();

			expect(enabled.isEnabled).toBe(true);
		});

		it("should return same instance when already enabled", () => {
			const settings = AISettings.create({ ...validProps, isEnabled: true });
			const result = settings.enable();

			expect(result).toBe(settings);
		});

		it("should disable an enabled setting", () => {
			const settings = AISettings.create({ ...validProps, isEnabled: true });
			const disabled = settings.disable();

			expect(disabled.isEnabled).toBe(false);
		});

		it("should return same instance when already disabled", () => {
			const settings = AISettings.create({ ...validProps, isEnabled: false });
			const result = settings.disable();

			expect(result).toBe(settings);
		});

		it("should toggle enabled to disabled", () => {
			const settings = AISettings.create({ ...validProps, isEnabled: true });
			const toggled = settings.toggle();

			expect(toggled.isEnabled).toBe(false);
		});

		it("should toggle disabled to enabled", () => {
			const settings = AISettings.create({ ...validProps, isEnabled: false });
			const toggled = settings.toggle();

			expect(toggled.isEnabled).toBe(true);
		});
	});

	describe("getEffectiveSystemIndicator", () => {
		it("should return indicator when enabled", () => {
			const settings = AISettings.create(validProps);
			expect(settings.getEffectiveSystemIndicator()).toBe(
				validProps.customSystemIndicator,
			);
		});

		it("should return null when disabled", () => {
			const settings = AISettings.create({ ...validProps, isEnabled: false });
			expect(settings.getEffectiveSystemIndicator()).toBeNull();
		});

		it("should return null when indicator is null", () => {
			const settings = AISettings.create({
				...validProps,
				customSystemIndicator: null,
			});
			expect(settings.getEffectiveSystemIndicator()).toBeNull();
		});
	});

	describe("hasCustomIndicator", () => {
		it("should return true when indicator exists", () => {
			const settings = AISettings.create(validProps);
			expect(settings.hasCustomIndicator()).toBe(true);
		});

		it("should return false when indicator is null", () => {
			const settings = AISettings.create({
				...validProps,
				customSystemIndicator: null,
			});
			expect(settings.hasCustomIndicator()).toBe(false);
		});

		it("should return false when indicator is empty", () => {
			const settings = AISettings.create({
				...validProps,
				customSystemIndicator: "   ",
			});
			// Note: The entity accepts this but hasCustomIndicator checks for non-empty
			// This test documents current behavior - we should trim on save
			expect(settings.hasCustomIndicator()).toBe(false);
		});
	});

	describe("character counting", () => {
		it("should return correct character count", () => {
			const settings = AISettings.create(validProps);
			expect(settings.getCharacterCount()).toBe(
				validProps.customSystemIndicator!.length,
			);
		});

		it("should return 0 for null indicator", () => {
			const settings = AISettings.create({
				...validProps,
				customSystemIndicator: null,
			});
			expect(settings.getCharacterCount()).toBe(0);
		});

		it("should return correct remaining characters", () => {
			const settings = AISettings.create(validProps);
			const expected =
				AI_SETTINGS_MAX_CHARS - validProps.customSystemIndicator!.length;
			expect(settings.getRemainingCharacters()).toBe(expected);
		});
	});

	describe("toJSON", () => {
		it("should serialize to JSON correctly", () => {
			const settings = AISettings.create(validProps);
			const json = settings.toJSON();

			expect(json.id).toBe(validProps.id);
			expect(json.userId).toBe(validProps.userId);
			expect(json.customSystemIndicator).toBe(validProps.customSystemIndicator);
			expect(json.isEnabled).toBe(validProps.isEnabled);
			expect(typeof json.createdAt).toBe("string");
			expect(typeof json.updatedAt).toBe("string");
		});
	});
});
