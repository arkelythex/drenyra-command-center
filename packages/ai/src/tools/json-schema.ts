import { z } from "zod";
import { toJSONSchema } from "zod";
import type { JSONSchemaObject } from "./tool-definition";

/**
 * Error thrown when `zodToolSchema` conversion fails.
 */
export class ZodSchemaConversionError extends Error {
	readonly cause: unknown;

	constructor(message: string, cause: unknown) {
		super(message);
		this.name = "ZodSchemaConversionError";
		this.cause = cause;
	}
}

/**
 * Convert a Zod schema to a Draft-07 JSON Schema object suitable for LLM
 * tool definitions.
 *
 * Features:
 * - Targets Draft-07 (most widely supported by LLM providers)
 * - Strips `$schema` meta-field (not needed by LLMs)
 * - Sets `additionalProperties: false` by default (strict param validation)
 * - Wraps errors in a typed `ZodSchemaConversionError`
 *
 * @param schema - Any Zod schema (typically a `z.object({...})`)
 * @returns A strict JSON Schema object with `type: "object"` guaranteed.
 *
 * @throws {ZodSchemaConversionError} if conversion fails
 */
export function zodToolSchema<T extends z.ZodTypeAny>(
	schema: T,
): JSONSchemaObject {
	try {
		const raw = toJSONSchema(schema, { target: "draft-07" });

		// Cast through unknown to avoid complex conditional return type
		const jsonSchema = raw as Record<string, unknown>;

		// Strip $schema meta-field — LLMs don't need it
		const { $schema: _, ...clean } = jsonSchema;

		// Enforce strict params: no extra properties allowed
		return {
			...clean,
			additionalProperties: false,
		} as JSONSchemaObject;
	} catch (err) {
		throw new ZodSchemaConversionError(
			`Failed to convert Zod schema to JSON Schema: ${err instanceof Error ? err.message : String(err)}`,
			err,
		);
	}
}

/**
 * Safely convert a Zod schema to JSON Schema, returning `null` on failure
 * instead of throwing.
 *
 * @param schema - Any Zod schema
 * @returns The JSON Schema object, or `null` if conversion fails
 */
export function zodToolSchemaSafe<T extends z.ZodTypeAny>(
	schema: T,
): JSONSchemaObject | null {
	try {
		return zodToolSchema(schema);
	} catch {
		return null;
	}
}
