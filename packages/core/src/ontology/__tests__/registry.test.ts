import { describe, expect, it } from "vitest";
import { z } from "zod";
import { OntologyRegistry } from "../registry";

describe("OntologyRegistry", () => {
	it("registers and retrieves a type definition", () => {
		const registry = new OntologyRegistry();
		const schema = z.object({ name: z.string() });

		registry.register({ name: "TestType", schema, owner: "test" });

		const def = registry.get("TestType");
		expect(def).toBeDefined();
		expect(def?.name).toBe("TestType");
		expect(def?.owner).toBe("test");
	});

	it("checks existence with has()", () => {
		const registry = new OntologyRegistry();
		registry.register({ name: "Exists", schema: z.object({}), owner: "test" });

		expect(registry.has("Exists")).toBe(true);
		expect(registry.has("Missing")).toBe(false);
	});

	it("returns undefined for unknown types", () => {
		const registry = new OntologyRegistry();
		expect(registry.get("Unknown")).toBeUndefined();
	});

	it("validates data against a registered schema", () => {
		const registry = new OntologyRegistry();
		const schema = z.object({ name: z.string(), age: z.number() });
		registry.register({ name: "Person", schema, owner: "test" });

		const valid = registry.validate("Person", { name: "Alice", age: 30 });
		expect(valid.success).toBe(true);
		expect(valid.data).toEqual({ name: "Alice", age: 30 });

		const invalid = registry.validate("Person", { name: "Bob" });
		expect(invalid.success).toBe(false);
		expect(invalid.error).toBeDefined();
	});

	it("returns error for unknown type in validate", () => {
		const registry = new OntologyRegistry();
		const result = registry.validate("NoSuchType", {});
		expect(result.success).toBe(false);
		expect(result.error).toBeInstanceOf(z.ZodError);
	});

	it("lists registered type names", () => {
		const registry = new OntologyRegistry();
		registry.register({ name: "A", schema: z.object({}), owner: "test" });
		registry.register({ name: "B", schema: z.object({}), owner: "test" });

		const names = registry.list();
		expect(names).toContain("A");
		expect(names).toContain("B");
		expect(names.length).toBe(2);
	});

	it("registers multiple definitions via registerAll", () => {
		const registry = new OntologyRegistry();
		registry.registerAll([
			{ name: "X", schema: z.object({}), owner: "test" },
			{ name: "Y", schema: z.object({}), owner: "test" },
		]);

		expect(registry.has("X")).toBe(true);
		expect(registry.has("Y")).toBe(true);
		expect(registry.list().length).toBe(2);
	});

	it("throws on duplicate registration", () => {
		const registry = new OntologyRegistry();
		registry.register({ name: "Dup", schema: z.object({}), owner: "test" });

		expect(() =>
			registry.register({ name: "Dup", schema: z.object({}), owner: "test" }),
		).toThrow('Ontology type "Dup" is already registered');
	});

	it("retains optional description when provided", () => {
		const registry = new OntologyRegistry();
		registry.register({
			name: "Described",
			description: "A test type",
			schema: z.object({}),
			owner: "test",
		});

		const def = registry.get("Described");
		expect(def?.description).toBe("A test type");
	});

	it("returns empty list when nothing is registered", () => {
		const registry = new OntologyRegistry();
		expect(registry.list()).toEqual([]);
	});
});
