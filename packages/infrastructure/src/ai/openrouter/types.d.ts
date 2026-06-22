export interface OpenRouterConfig {
    apiKey: string;
    baseUrl?: string;
    defaultModel?: string;
    timeout?: number;
    maxRetries?: number;
    budgetLimit?: number;
    preferredProviders?: string[];
    excludedProviders?: string[];
    enableAutoRouting?: boolean;
}
export interface OpenRouterMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    name?: string;
    tool_call_id?: string;
    tool_calls?: OpenRouterToolCall[];
}
export interface OpenRouterToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}
export interface OpenRouterRequest {
    model: string;
    messages: OpenRouterMessage[];
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    tools?: OpenRouterTool[];
    tool_choice?: 'auto' | 'none' | {
        type: 'function';
        function: {
            name: string;
        };
    };
    provider?: OpenRouterProviderConfig;
    transforms?: string[];
    models?: string[];
    route?: 'fallback' | 'routing-shuffle';
}
export interface OpenRouterTool {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: {
            type: 'object';
            properties: Record<string, unknown>;
            required?: string[];
        };
    };
}
export interface OpenRouterProviderConfig {
    order?: string[];
    allow_fallbacks?: boolean;
    require_parameters?: boolean;
    data_collection?: 'allow' | 'deny';
    only?: string[];
    ignore?: string[];
    sort?: 'price' | 'throughput' | 'latency';
}
export interface OpenRouterResponse {
    id: string;
    model: string;
    choices: {
        index: number;
        message: OpenRouterMessage;
        finish_reason: string;
    }[];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
        cost: number;
    };
    created: number;
}
export interface OpenRouterModel {
    id: string;
    name: string;
    description: string;
    pricing: {
        prompt: number;
        completion: number;
    };
    context_length: number;
    architecture: {
        modality: string;
        tokenizer: string;
        instruct_type: string | null;
    };
    top_provider: {
        context_length: number | null;
        max_completion_tokens: number | null;
        is_moderated: boolean;
    };
    per_request_limits: Record<string, unknown> | null;
}
export interface CostMetrics {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    monthlyBudget: number;
    budgetRemaining: number;
    modelBreakdown: Map<string, {
        requests: number;
        tokens: number;
        cost: number;
    }>;
    providerBreakdown: Map<string, {
        requests: number;
        cost: number;
    }>;
}
export declare const AGENT_MODEL_MAP: Record<string, string[]>;
export type StreamChunk = {
    type: 'token';
    content: string;
} | {
    type: 'tool_call_start';
    id: string;
    name: string;
} | {
    type: 'tool_call_delta';
    id: string;
    arguments: string;
} | {
    type: 'tool_call_end';
    id: string;
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
//# sourceMappingURL=types.d.ts.map