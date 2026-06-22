type OpenRouterJsonType = 'string' | 'number' | 'boolean' | 'array' | 'object';
interface OpenRouterJsonSchemaProperty {
    type: OpenRouterJsonType;
    description: string;
    enum?: unknown[];
    items?: {
        type: OpenRouterJsonType;
    };
}
interface OpenRouterJsonObjectSchema {
    type: 'object';
    properties: Record<string, OpenRouterJsonSchemaProperty>;
    required: string[];
}
type ZodIntrospectable = {
    description?: string;
    _def?: {
        description?: string;
        innerType?: unknown;
        type?: unknown;
        typeName?: string;
        values?: readonly unknown[];
    };
};
type ToolStreamEvent = {
    type: 'token';
    content: string;
} | {
    type: 'tool_call_start';
    name: string;
    id: string;
} | {
    type: 'tool_executing';
    name: string;
    args: unknown;
} | {
    type: 'tool_result';
    name: string;
    result: unknown;
} | {
    type: 'tool_error';
    name: string;
    error: string;
} | {
    type: 'approval_required';
    name: string;
    args: unknown;
    toolCallId: string;
} | {
    type: 'approval_decision';
    name: string;
    toolCallId: string;
    approved: boolean;
} | {
    type: 'usage';
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
        cost: number;
    };
} | {
    type: 'done';
    finish_reason: string;
};
interface ToolApprovalRequest {
    name: string;
    args: unknown;
    toolCallId: string;
}
//# sourceMappingURL=types.d.ts.map