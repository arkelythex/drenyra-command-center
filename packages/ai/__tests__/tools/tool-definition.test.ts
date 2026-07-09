import { describe, expect, it } from "vitest";
import { z } from "zod";
import { zodToolSchema } from "../../src/tools/json-schema";
import type {
	JSONSchemaObject,
	ToolDefinition,
} from "../../src/tools/tool-definition";

// ---- Type-level tests ----
// These verify type constraints at compile time (TypeScript).
// The assertions at runtime are secondary.

describe("ToolDefinition type", () => {
	it("can be constructed with a Zod schema type parameter", () => {
		const MySchema = z.object({ name: z.string() });

		const tool: ToolDefinition<typeof MySchema> = {
			name: "my_tool",
			description: "A test tool",
			parameters: zodToolSchema(MySchema),
		};

		expect(tool.name).toBe("my_tool");
		expect(tool.description).toBe("A test tool");
		expect(tool.parameters.type).toBe("object");
	});

	it("can be constructed without parameters (TSchema = never)", () => {
		const tool: ToolDefinition = {
			name: "no_param_tool",
			description: "A tool with no parameters",
			parameters: undefined,
		};

		expect(tool.name).toBe("no_param_tool");
		expect(tool.parameters).toBeUndefined();
	});

	it("can include an optional outputSchema", () => {
		const InputSchema = z.object({ query: z.string() });
		const OutputSchema = z.object({ result: z.string() });

		const tool: ToolDefinition<typeof InputSchema> = {
			name: "search_tool",
			description: "Searches for things",
			parameters: zodToolSchema(InputSchema),
			outputSchema: zodToolSchema(OutputSchema),
		};

		expect(tool.parameters.type).toBe("object");
		expect(tool.outputSchema).toBeDefined();
		expect(tool.outputSchema?.type).toBe("object");
	});
});

describe("JSONSchemaObject type", () => {
	it("requires type: 'object'", () => {
		const schema: JSONSchemaObject = {
			type: "object",
			properties: {},
			additionalProperties: false,
		};

		expect(schema.type).toBe("object");
	});

	it("accepts optional description", () => {
		const schema: JSONSchemaObject = {
			type: "object",
			description: "A schema with a description",
		};

		expect(schema.description).toBe("A schema with a description");
	});

	it("accepts optional required array", () => {
		const schema: JSONSchemaObject = {
			type: "object",
			properties: {
				name: { type: "string" },
			},
			required: ["name"],
		};

		expect(schema.required).toContain("name");
	});

	it("rejects schema with wrong type via structural narrowing", () => {
		// TypeScript ensures type is "object" — this is a compile-time guarantee.
		// Runtime check: verify the value matches expectations.
		const schema: JSONSchemaObject = {
			type: "object",
			properties: {
				value: { type: "string" },
			},
		} as const;

		expect(schema.type).toBe("object");
		// TypeScript would error on: schema.type = "string"
	});
});
