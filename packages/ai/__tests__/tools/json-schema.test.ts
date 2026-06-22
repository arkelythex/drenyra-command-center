import { describe, it, expect } from "vitest";
import { z } from "zod";
import { zodToolSchema, ZodSchemaConversionError } from "../../src/tools/json-schema";
import type { JSONSchemaObject } from "../../src/tools/tool-definition";

describe("zodToolSchema", () => {
	// ---- Basic types ----

	it("converts z.object({}) to object type with empty properties", () => {
		const schema = z.object({});
		const result = zodToolSchema(schema);

		expect(result).toBeDefined();
		expect(result.type).toBe("object");
		expect(result.properties).toEqual({});
		expect(result.additionalProperties).toBe(false);
	});

	it("converts string property to { type: 'string' }", () => {
		const schema = z.object({ name: z.string() });
		const result = zodToolSchema(schema);

		expect(result.type).toBe("object");
		expect(result.properties?.name).toBeDefined();
	});

	it("converts number property to { type: 'number' }", () => {
		const schema = z.object({ count: z.number() });
		const result = zodToolSchema(schema);

		expect(result.type).toBe("object");
		expect(result.properties?.count).toBeDefined();
	});

	it("converts boolean property to { type: 'boolean' }", () => {
		const schema = z.object({ active: z.boolean() });
		const result = zodToolSchema(schema);

		expect(result.type).toBe("object");
		expect(result.properties?.active).toBeDefined();
	});

	// ---- Enum ----

	it("converts enum to property with enum values", () => {
		const schema = z.object({
			status: z.enum(["active", "inactive", "pending"]),
		});
		const result = zodToolSchema(schema);

		expect(result.type).toBe("object");
		const statusProp = result.properties?.status as Record<string, unknown>;
		expect(statusProp.enum).toBeDefined();
	});

	// ---- Optional fields ----

	it("treats optional fields as not required", () => {
		const schema = z.object({
			required: z.string(),
			optional: z.string().optional(),
		});
		const result = zodToolSchema(schema);

		expect(result.type).toBe("object");
		// required field should be in the required array
		const props = result.properties as Record<string, unknown>;
		expect(props.required).toBeDefined();
	});

	// ---- Arrays ----

	it("converts array property to { type: 'array', items: ... }", () => {
		const schema = z.object({
			tags: z.array(z.string()),
		});
		const result = zodToolSchema(schema);

		expect(result.type).toBe("object");
		const tagsProp = result.properties?.tags as Record<string, unknown>;
		expect(tagsProp.type).toBe("array");
		expect(tagsProp.items).toBeDefined();
	});

	// ---- Nested objects ----

	it("converts nested z.object to nested properties object", () => {
		const schema = z.object({
			address: z.object({
				street: z.string(),
				city: z.string(),
			}),
		});
		const result = zodToolSchema(schema);

		expect(result.type).toBe("object");
		const addrProp = result.properties?.address as Record<string, unknown>;
		expect(addrProp.type).toBe("object");
		const addrProps = addrProp.properties as Record<string, unknown>;
		expect(addrProps.street).toBeDefined();
		expect(addrProps.city).toBeDefined();
	});

	// ---- additionalProperties: false ----

	it("always sets additionalProperties: false", () => {
		const schema = z.object({ name: z.string() });
		const result = zodToolSchema(schema);

		expect(result).toHaveProperty("additionalProperties", false);
	});

	it("sets additionalProperties: false even for empty object", () => {
		const schema = z.object({});
		const result = zodToolSchema(schema);

		expect(result).toHaveProperty("additionalProperties", false);
	});

	// ---- $schema is stripped ----

	it("strips $schema meta-field from output", () => {
		const schema = z.object({ name: z.string() });
		const result = zodToolSchema(schema);

		expect(result).not.toHaveProperty("$schema");
	});

	// ---- Return type is JSONSchemaObject ----

	it("returns a JSONSchemaObject (type: object)", () => {
		// TypeScript compile-time check: result must be assignable to JSONSchemaObject
		const schema = z.object({ name: z.string() });
		const result: JSONSchemaObject = zodToolSchema(schema);

		expect(result.type).toBe("object");
		expect(typeof result.properties).toBe("object");
	});

	// ---- Error handling ----

	it("throws ZodSchemaConversionError for invalid input", () => {
		// Pass a non-Zod-schema value that will fail at runtime
		const invalid = {} as z.ZodTypeAny;

		expect(() => zodToolSchema(invalid)).toThrow(ZodSchemaConversionError);
	});
});
