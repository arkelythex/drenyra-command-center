import { toJSONSchema } from "zod";
export class ZodSchemaConversionError extends Error {
    cause;
    constructor(message, cause) {
        super(message);
        this.name = "ZodSchemaConversionError";
        this.cause = cause;
    }
}
export function zodToolSchema(schema) {
    try {
        const raw = toJSONSchema(schema, { target: "draft-07" });
        const jsonSchema = raw;
        const { $schema: _, ...clean } = jsonSchema;
        return {
            ...clean,
            additionalProperties: false,
        };
    }
    catch (err) {
        throw new ZodSchemaConversionError(`Failed to convert Zod schema to JSON Schema: ${err instanceof Error ? err.message : String(err)}`, err);
    }
}
export function zodToolSchemaSafe(schema) {
    try {
        return zodToolSchema(schema);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=json-schema.js.map