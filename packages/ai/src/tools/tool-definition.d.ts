import type { z } from "zod";
export type JSONSchemaObject = {
    type: "object";
    description?: string;
    properties?: Record<string, unknown>;
    additionalProperties?: boolean | Record<string, unknown>;
    required?: string[];
    [key: string]: unknown;
};
export interface ToolDefinition<TSchema extends z.ZodTypeAny = never> {
    name: string;
    description: string;
    parameters: TSchema extends z.ZodTypeAny ? JSONSchemaObject : undefined;
    outputSchema?: JSONSchemaObject;
}
//# sourceMappingURL=tool-definition.d.ts.map