/**
 * OpenRouter Integration - ARKELYTHEX 2026
 *
 * Unified LLM API integration for multi-agent system
 * Access to 300+ models from 60+ providers with single API key
 *
 * Features:
 * - Model routing (auto & manual)
 * - Provider fallback management
 * - Cost tracking and budgeting
 * - Multi-model workflows
 *
 * @since 2026.1.0
 */

/**
 * OpenRouterConfig interface.
 *
 * @example
 * ```ts
 * const value: OpenRouterConfig = {} as OpenRouterConfig;
 * console.log(value);
 * ```
 */
export interface OpenRouterConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  timeout?: number;
  maxRetries?: number;
  budgetLimit?: number; // Monthly budget in USD
  preferredProviders?: string[];
  excludedProviders?: string[];
  enableAutoRouting?: boolean;
}

/**
 * OpenRouterMessage interface.
 *
 * @example
 * ```ts
 * const value: OpenRouterMessage = {} as OpenRouterMessage;
 * console.log(value);
 * ```
 */
export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: OpenRouterToolCall[];
}

/**
 * OpenRouterToolCall interface.
 *
 * @example
 * ```ts
 * const value: OpenRouterToolCall = {} as OpenRouterToolCall;
 * console.log(value);
 * ```
 */
export interface OpenRouterToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * OpenRouterRequest interface.
 *
 * @example
 * ```ts
 * const value: OpenRouterRequest = {} as OpenRouterRequest;
 * console.log(value);
 * ```
 */
export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  tools?: OpenRouterTool[];
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
  provider?: OpenRouterProviderConfig;
  transforms?: string[];
  models?: string[]; // For model fallbacks
  route?: 'fallback' | 'routing-shuffle';
}

/**
 * OpenRouterTool interface.
 *
 * @example
 * ```ts
 * const value: OpenRouterTool = {} as OpenRouterTool;
 * console.log(value);
 * ```
 */
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

/**
 * OpenRouterProviderConfig interface.
 *
 * @example
 * ```ts
 * const value: OpenRouterProviderConfig = {} as OpenRouterProviderConfig;
 * console.log(value);
 * ```
 */
export interface OpenRouterProviderConfig {
  order?: string[];
  allow_fallbacks?: boolean;
  require_parameters?: boolean;
  data_collection?: 'allow' | 'deny';
  only?: string[];
  ignore?: string[];
  sort?: 'price' | 'throughput' | 'latency';
}

/**
 * OpenRouterResponse interface.
 *
 * @example
 * ```ts
 * const value: OpenRouterResponse = {} as OpenRouterResponse;
 * console.log(value);
 * ```
 */
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
    cost: number; // USD
  };
  created: number;
}

/**
 * OpenRouterModel interface.
 *
 * @example
 * ```ts
 * const value: OpenRouterModel = {} as OpenRouterModel;
 * console.log(value);
 * ```
 */
export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  pricing: {
    prompt: number; // USD per 1K tokens
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

/**
 * CostMetrics interface.
 *
 * @example
 * ```ts
 * const value: CostMetrics = {} as CostMetrics;
 * console.log(value);
 * ```
 */
export interface CostMetrics {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  monthlyBudget: number;
  budgetRemaining: number;
  modelBreakdown: Map<string, { requests: number; tokens: number; cost: number }>;
  providerBreakdown: Map<string, { requests: number; cost: number }>;
}

/**
 * Model mapping for ARKELYTHEX agent types
 * @example
 * ```ts
 * console.log(AGENT_MODEL_MAP);
 * ```
 */

export const AGENT_MODEL_MAP: Record<string, string[]> = {
  // Code Review Agents
  'security-audit-agent': [
    'anthropic/claude-sonnet-4.5', // Best for code analysis
    'openai/gpt-5.1', // Fallback
  ],
  'quality-analyzer-agent': [
    'anthropic/claude-sonnet-4.5',
    'deepseek/deepseek-coder-v3.2',
  ],
  'performance-analyzer-agent': [
    'anthropic/claude-sonnet-4.5',
    'openai/gpt-5.1',
  ],

  // Development Agents
  'code-generator-agent': [
    'anthropic/claude-opus-4.5', // Best for code generation
    'deepseek/deepseek-coder-v3.2',
    'openai/gpt-5.1',
  ],
  'documentation-agent': [
    'anthropic/claude-sonnet-4.5',
    'openai/gpt-5.1',
  ],

  // Financial Agents (SUNAT)
  'sunat-compliance-agent': [
    'anthropic/claude-sonnet-4.5', // Best for regulatory analysis
    'openai/gpt-5.1',
  ],
  'tax-optimizer-agent': [
    'anthropic/claude-sonnet-4.5',
    'google/gemini-3-pro-preview',
  ],
  'financial-analyzer-agent': [
    'anthropic/claude-sonnet-4.5',
    'openai/gpt-5.1',
  ],

  // AI/ML Agents
  'model-trainer-agent': [
    'openai/gpt-5.1',
    'google/gemini-3-pro-preview',
  ],
  'prediction-engine-agent': [
    'openai/gpt-5.1',
    'anthropic/claude-sonnet-4.5',
  ],
  'anomaly-detector-agent': [
    'openai/gpt-5.1',
    'google/gemini-3-pro-preview',
  ],

  // Default fallback
  'default': [
    'openrouter/auto', // Auto-router selects best model
    'anthropic/claude-sonnet-4.5',
    'openai/gpt-5.1',
  ],
};

/**
 * Stream chunk types for chatCompletionStream()
 * @example
 * ```ts
 * const value: StreamChunk = {} as StreamChunk;
 * console.log(value);
 * ```
 */

export type StreamChunk =
  | { type: 'token'; content: string }
  | { type: 'tool_call_start'; id: string; name: string }
  | { type: 'tool_call_delta'; id: string; arguments: string }
  | { type: 'tool_call_end'; id: string }
  | { type: 'usage'; usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number; cost: number } }
  | { type: 'done'; finish_reason: string };
