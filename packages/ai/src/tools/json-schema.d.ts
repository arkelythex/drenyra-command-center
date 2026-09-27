import { type z } from "zod";
import type { JSONSchemaObject } from "./tool-definition";
export declare class ZodSchemaConversionError extends Error {
    readonly cause: unknown;
    constructor(message: string, cause: unknown);
}
export declare function zodToolSchema<T extends z.ZodTypeAny>(schema: T): JSONSchemaObject;
export declare function zodToolSchemaSafe<T extends z.ZodTypeAny>(schema: T): JSONSchemaObject | null;
//# sourceMappingURL=json-schema.d.ts.map