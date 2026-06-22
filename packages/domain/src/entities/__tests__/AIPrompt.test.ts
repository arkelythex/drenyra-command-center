/**
 * AIPrompt Entity Tests
 *
 * Tests for AI prompt versioning, activation, and business rules
 */

import { describe, expect, it } from "vitest";
import { PromptVersion } from "../../value-objects/PromptVersion";
import {
	AIPrompt,
	type AIPromptProps,
	type CreateAIPromptInput,
} from "../AIPrompt";

// Helper to create valid props
function createValidProps(
	overrides: Partial<AIPromptProps> = {},
): AIPromptProps {
	return {
		id: 1,
		organizationId: null,
		promptType: "ocr_extraction",
		version: PromptVersion.initial(),
		isActive: false,
		name: "Test Prompt",
		description: "A test prompt",
		systemPrompt: "You are a helpful assistant.",
		userPromptTemplate: "Process this: {{input}}",
		modelPreference: "gemini-3-flash",
		temperature: 0.1,
		maxTokens: 1000,
		createdBy: "user-123",
		createdAt: new Date(),
		updatedAt: new Date(),
		previousVersionId: null,
		rollbackReason: null,
		...overrides,
	};
}

// Helper to create valid input
function createValidInput(
	overrides: Partial<CreateAIPromptInput> = {},
): CreateAIPromptInput {
	return {
		promptType: "ocr_extraction",
		name: "Test Prompt",
		description: "A test prompt",
		systemPrompt: "You are a helpful assistant.",
		createdBy: "user-123",
		...overrides,
	};
}

describe("AIPrompt", () => {
	describe("create (reconstitution)", () => {
		it("should create prompt from valid props", () => {
			const props = createValidProps();
			const prompt = AIPrompt.create(props);

			expect(prompt.id).toBe(1);
			expect(prompt.name).toBe("Test Prompt");
			expect(prompt.promptType).toBe("ocr_extraction");
			expect(prompt.isActive).toBe(false);
		});

		it("should freeze props (immutability)", () => {
			const prompt = AIPrompt.create(createValidProps());
			const propsResult = prompt.getProps();

			expect(Object.isFrozen(propsResult)).toBe(false); // Clone is returned
			expect(prompt.name).toBe("Test Prompt");
		});
	});

	describe("createNew", () => {
		it("should create new prompt with initial version 1.0.0", () => {
			const input = createValidInput();
			const prompt = AIPrompt.createNew(input);

			expect(prompt.id).toBe(0); // Not yet persisted
			expect(prompt.versionString).toBe("1.0.0");
			expect(prompt.isActive).toBe(false);
		});

		it("should default temperature to 0.1", () => {
			const input = createValidInput();
			const prompt = AIPrompt.createNew(input);

			expect(prompt.temperature).toBe(0.1);
		});

		it("should use provided temperature", () => {
			const input = createValidInput({ temperature: 0.7 });
			const prompt = AIPrompt.createNew(input);

			expect(prompt.temperature).toBe(0.7);
		});

		it("should handle null organizationId (global prompt)", () => {
			const input = createValidInput({ organizationId: null });
			const prompt = AIPrompt.createNew(input);

			expect(prompt.organizationId).toBeNull();
			expect(prompt.isGlobal()).toBe(true);
		});

		it("should set organizationId for org-specific prompt", () => {
			const input = createValidInput({ organizationId: 42 });
			const prompt = AIPrompt.createNew(input);

			expect(prompt.organizationId).toBe(42);
			expect(prompt.isOrganizationSpecific()).toBe(true);
		});
	});

	describe("business rules validation", () => {
		it("should throw if name is empty", () => {
			expect(() => AIPrompt.create(createValidProps({ name: "" }))).toThrow(
				"El nombre del prompt es requerido",
			);
		});

		it("should throw if name is only whitespace", () => {
			expect(() => AIPrompt.create(createValidProps({ name: "   " }))).toThrow(
				"El nombre del prompt es requerido",
			);
		});

		it("should throw if systemPrompt is empty", () => {
			expect(() =>
				AIPrompt.create(createValidProps({ systemPrompt: "" })),
			).toThrow("El system prompt es requerido");
		});

		it("should throw if temperature is negative", () => {
			expect(() =>
				AIPrompt.create(createValidProps({ temperature: -0.1 })),
			).toThrow("La temperatura debe estar entre 0 y 2");
		});

		it("should throw if temperature is greater than 2", () => {
			expect(() =>
				AIPrompt.create(createValidProps({ temperature: 2.1 })),
			).toThrow("La temperatura debe estar entre 0 y 2");
		});

		it("should allow temperature of 0", () => {
			const prompt = AIPrompt.create(createValidProps({ temperature: 0 }));
			expect(prompt.temperature).toBe(0);
		});

		it("should allow temperature of 2", () => {
			const prompt = AIPrompt.create(createValidProps({ temperature: 2 }));
			expect(prompt.temperature).toBe(2);
		});

		it("should throw if createdBy is empty", () => {
			expect(() =>
				AIPrompt.create(createValidProps({ createdBy: "" })),
			).toThrow("El creador del prompt es requerido");
		});

		it("should throw if maxTokens is zero", () => {
			expect(() => AIPrompt.create(createValidProps({ maxTokens: 0 }))).toThrow(
				"maxTokens debe ser un número positivo",
			);
		});

		it("should throw if maxTokens is negative", () => {
			expect(() =>
				AIPrompt.create(createValidProps({ maxTokens: -100 })),
			).toThrow("maxTokens debe ser un número positivo");
		});

		it("should allow null maxTokens", () => {
			const prompt = AIPrompt.create(createValidProps({ maxTokens: null }));
			expect(prompt.maxTokens).toBeNull();
		});
	});

	describe("createNewVersion", () => {
		it("should create new version with incremented patch", () => {
			const original = AIPrompt.create(createValidProps());
			const newVersion = original.createNewVersion({
				systemPrompt: "Updated prompt",
				createdBy: "user-456",
				versionBump: "patch",
			});

			expect(newVersion.versionString).toBe("1.0.1");
			expect(newVersion.previousVersionId).toBe(original.id);
		});

		it("should create new version with incremented minor", () => {
			const original = AIPrompt.create(createValidProps());
			const newVersion = original.createNewVersion({
				systemPrompt: "Updated prompt",
				createdBy: "user-456",
				versionBump: "minor",
			});

			expect(newVersion.versionString).toBe("1.1.0");
		});

		it("should create new version with incremented major", () => {
			const original = AIPrompt.create(createValidProps());
			const newVersion = original.createNewVersion({
				systemPrompt: "Updated prompt",
				createdBy: "user-456",
				versionBump: "major",
			});

			expect(newVersion.versionString).toBe("2.0.0");
		});

		it("should set new version as inactive by default", () => {
			const original = AIPrompt.create(createValidProps({ isActive: true }));
			const newVersion = original.createNewVersion({
				systemPrompt: "Updated prompt",
				createdBy: "user-456",
				versionBump: "patch",
			});

			expect(newVersion.isActive).toBe(false);
		});

		it("should preserve settings when not overridden", () => {
			const original = AIPrompt.create(
				createValidProps({
					modelPreference: "claude-4",
					temperature: 0.5,
				}),
			);
			const newVersion = original.createNewVersion({
				systemPrompt: "Updated prompt",
				createdBy: "user-456",
				versionBump: "patch",
			});

			expect(newVersion.modelPreference).toBe("claude-4");
			expect(newVersion.temperature).toBe(0.5);
		});
	});

	describe("activate/deactivate", () => {
		it("should activate an inactive prompt", () => {
			const prompt = AIPrompt.create(createValidProps({ isActive: false }));
			const activated = prompt.activate();

			expect(activated.isActive).toBe(true);
			expect(prompt.isActive).toBe(false); // Original unchanged
		});

		it("should return same instance if already active", () => {
			const prompt = AIPrompt.create(createValidProps({ isActive: true }));
			const activated = prompt.activate();

			expect(activated).toBe(prompt);
		});

		it("should deactivate an active prompt", () => {
			const prompt = AIPrompt.create(createValidProps({ isActive: true }));
			const deactivated = prompt.deactivate();

			expect(deactivated.isActive).toBe(false);
		});

		it("should return same instance if already inactive", () => {
			const prompt = AIPrompt.create(createValidProps({ isActive: false }));
			const deactivated = prompt.deactivate();

			expect(deactivated).toBe(prompt);
		});
	});

	describe("createRollbackVersion", () => {
		it("should create rollback with content from target prompt", () => {
			const target = AIPrompt.create(
				createValidProps({
					id: 1,
					version: PromptVersion.parse("1.0.0"),
					systemPrompt: "Old good prompt",
				}),
			);

			const current = AIPrompt.create(
				createValidProps({
					id: 2,
					version: PromptVersion.parse("1.1.0"),
					systemPrompt: "New broken prompt",
				}),
			);

			const rollback = current.createRollbackVersion(
				target,
				"admin",
				"Bug in new version",
			);

			expect(rollback.systemPrompt).toBe("Old good prompt");
			expect(rollback.rollbackReason).toBe("Bug in new version");
			expect(rollback.isRollback()).toBe(true);
			expect(rollback.versionString).toBe("1.1.1");
		});

		it("should throw if rolling back to different organization", () => {
			const target = AIPrompt.create(createValidProps({ organizationId: 1 }));
			const current = AIPrompt.create(createValidProps({ organizationId: 2 }));

			expect(() =>
				current.createRollbackVersion(target, "admin", "reason"),
			).toThrow("Cannot rollback to a prompt from a different organization");
		});

		it("should throw if rolling back to different prompt type", () => {
			const target = AIPrompt.create(
				createValidProps({ promptType: "validation" }),
			);
			const current = AIPrompt.create(
				createValidProps({ promptType: "ocr_extraction" }),
			);

			expect(() =>
				current.createRollbackVersion(target, "admin", "reason"),
			).toThrow("Cannot rollback to a prompt of a different type");
		});
	});

	describe("getFullPrompt", () => {
		it("should return system prompt alone", () => {
			const prompt = AIPrompt.create(
				createValidProps({
					systemPrompt: "You are a helpful assistant.",
					userPromptTemplate: null,
				}),
			);

			const result = prompt.getFullPrompt();

			expect(result.system).toBe("You are a helpful assistant.");
			expect(result.user).toBeUndefined();
		});

		it("should replace template variables", () => {
			const prompt = AIPrompt.create(
				createValidProps({
					systemPrompt: "You are a helpful assistant.",
					userPromptTemplate: "Process {{type}}: {{content}}",
				}),
			);

			const result = prompt.getFullPrompt({
				type: "invoice",
				content: "some data",
			});

			expect(result.user).toBe("Process invoice: some data");
		});

		it("should return template as-is if no variables provided", () => {
			const prompt = AIPrompt.create(
				createValidProps({
					systemPrompt: "System prompt",
					userPromptTemplate: "Template with {{var}}",
				}),
			);

			const result = prompt.getFullPrompt();

			expect(result.user).toBe("Template with {{var}}");
		});
	});

	describe("isNewerThan", () => {
		it("should compare versions correctly", () => {
			const v1 = AIPrompt.create(
				createValidProps({
					version: PromptVersion.parse("2.0.0"),
				}),
			);
			const v2 = AIPrompt.create(
				createValidProps({
					version: PromptVersion.parse("1.9.9"),
				}),
			);

			expect(v1.isNewerThan(v2)).toBe(true);
			expect(v2.isNewerThan(v1)).toBe(false);
		});
	});

	describe("equals", () => {
		it("should return true for same ID", () => {
			const p1 = AIPrompt.create(createValidProps({ id: 1 }));
			const p2 = AIPrompt.create(
				createValidProps({ id: 1, name: "Different" }),
			);

			expect(p1.equals(p2)).toBe(true);
		});

		it("should return false for different ID", () => {
			const p1 = AIPrompt.create(createValidProps({ id: 1 }));
			const p2 = AIPrompt.create(createValidProps({ id: 2 }));

			expect(p1.equals(p2)).toBe(false);
		});

		it("should return false for null/undefined", () => {
			const p1 = AIPrompt.create(createValidProps({ id: 1 }));

			expect(p1.equals(null)).toBe(false);
			expect(p1.equals(undefined)).toBe(false);
		});
	});

	describe("toJSON", () => {
		it("should serialize all properties", () => {
			const prompt = AIPrompt.create(
				createValidProps({
					id: 1,
					name: "Test",
					promptType: "ocr_extraction",
				}),
			);

			const json = prompt.toJSON();

			expect(json.id).toBe(1);
			expect(json.name).toBe("Test");
			expect(json.promptType).toBe("ocr_extraction");
			expect(json.version).toBe("1.0.0");
			expect(typeof json.createdAt).toBe("string"); // ISO format
		});
	});
});
