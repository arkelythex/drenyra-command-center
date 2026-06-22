import { z } from "zod";

/**
 * Strict JSON Schema object type for LLM tool parameters.
 *
 * Extends Draft-07 JSON Schema with LLM-specific requirements:
 * - `type: "object"` is required
 * - `additionalProperties` defaults to `false`
 * - `properties` may be present or absent (no-param tools)
 * - `required` arrays list mandatory properties
 *
 * This is stricter than `Record<string, unknown>` — unknown keys are
 * a type error at the `ToolDefinition.parameters` field level.
 */
export type JSONSchemaObject = {
	type: "object";
	description?: string;
	properties?: Record<string, unknown>;
	additionalProperties?: boolean | Record<string, unknown>;
	required?: string[];
	[key: string]: unknown;
};

/**
 * Type-safe tool definition with JSON Schema parameters.
 *
 * @typeParam TSchema - the Zod schema type. Defaults to `never`, which
 *   makes `parameters` resolve to `undefined` (no-param tools).
 *
 * @example
 * ```ts
 * const myTool: ToolDefinition<typeof MySchema> = {
 *   name: "my_tool",
 *   description: "Does something",
 *   parameters: zodToolSchema(MySchema),
 * };
 * ```
 */
export interface ToolDefinition<TSchema extends z.ZodTypeAny = never> {
	/** Canonical tool name (used in LLM function_call and registry lookups). */
	name: string;

	/** Human-readable description of what the tool does. */
	description: string;

	/**
	 * JSON Schema object describing tool parameters.
	 * - When TSchema is provided: typed as `JSONSchemaObject`
	 * - When TSchema is `never` (default, no params): resolves to `undefined`
	 */
	parameters: TSchema extends z.ZodTypeAny
		? JSONSchemaObject
		: undefined;

	/**
	 * Optional JSON Schema describing the tool's output shape.
	 * Useful for structured output validation and documentation.
	 */
	outputSchema?: JSONSchemaObject;
}
