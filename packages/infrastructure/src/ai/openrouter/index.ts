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

import { loggers } from '../../logger.js';

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

/**
 * OpenRouter Service - Main integration class
 * @example
 * ```ts
 * const value = new OpenRouterService();
 * console.log(value);
 * ```
 */

export class OpenRouterService {
  private config: OpenRouterConfig;
  private costTracker: CostTracker;
  private modelCache: Map<string, OpenRouterModel> = new Map();
  private lastFetch: Date | null = null;

  constructor(config: OpenRouterConfig) {
    this.config = {
      baseUrl: 'https://openrouter.ai/api/v1',
      timeout: 60000,
      maxRetries: 3,
      enableAutoRouting: true,
      ...config,
    };
    this.costTracker = new CostTracker(config.budgetLimit || 1000);
  }

  /**
   * Send chat completion request
   */
  async chatCompletion(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    // Try with retries and fallbacks
    for (let attempt = 0; attempt < (this.config.maxRetries || 3); attempt++) {
      try {
        const response = await this.makeRequest(request);
        
        // Track costs
        this.costTracker.trackRequest(
          response.model,
          response.usage.prompt_tokens,
          response.usage.completion_tokens,
          response.usage.cost
        );

        loggers.ai.info('OpenRouter request successful', {
          model: response.model,
          tokens: response.usage.total_tokens,
          cost: response.usage.cost,
          duration: Date.now() - startTime,
        });

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // If we have fallback models, try next one
        if (request.models && request.models.length > attempt + 1) {
          request.model = request.models[attempt + 1];
          loggers.ai.warn(`Fallback to model: ${request.model}`, {
            previousError: lastError.message,
            attempt: attempt + 1,
          });
          continue;
        }

        // Wait before retry
        if (attempt < (this.config.maxRetries || 3) - 1) {
          await this.sleep(Math.pow(2, attempt) * 1000); // Exponential backoff
        }
      }
    }

    throw lastError || new Error('All retries failed');
  }

  /**
   * Stream chat completion with token-level granularity
   * OpenRouter supports OpenAI-compatible streaming via `stream: true`
   */
  async *chatCompletionStream(
    request: OpenRouterRequest
  ): AsyncGenerator<StreamChunk> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter streaming failed: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentModel = request.model;
    const toolCallIdByIndex = new Map<number, string>();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta;
            const choice = json.choices?.[0];

            if (json.error) {
              const message = typeof json.error?.message === 'string'
                ? json.error.message
                : 'Unknown OpenRouter streaming error';
              throw new Error(`OpenRouter stream error: ${message}`);
            }

            // Track model being used
            if (json.model) {
              currentModel = json.model;
            }

            // Stream text tokens
            if (delta?.content) {
              yield { type: 'token', content: delta.content };
            }

            // Stream tool calls
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                const index = typeof tc.index === 'number' ? tc.index : 0;
                const resolvedId = tc.id ?? toolCallIdByIndex.get(index) ?? `tool_call_${index}_${Date.now()}`;
                toolCallIdByIndex.set(index, resolvedId);

                if (tc.function?.name) {
                  yield { type: 'tool_call_start', id: resolvedId, name: tc.function.name };
                }
                if (tc.function?.arguments) {
                  yield { type: 'tool_call_delta', id: resolvedId, arguments: tc.function.arguments };
                }
              }
            }

            // Usage and finish
            if (choice?.finish_reason) {
              if (json.usage) {
                const cost = this.calculateCostFromUsage(currentModel, json.usage);

                // Track cost
                this.costTracker.trackRequest(
                  currentModel,
                  json.usage.prompt_tokens,
                  json.usage.completion_tokens,
                  cost
                );

                yield {
                  type: 'usage',
                  usage: {
                    prompt_tokens: json.usage.prompt_tokens,
                    completion_tokens: json.usage.completion_tokens,
                    total_tokens: json.usage.total_tokens,
                    cost,
                  },
                };
              }

              yield { type: 'done', finish_reason: choice.finish_reason };
            }
          } catch (parseError) {
            // Skip malformed SSE chunks
            loggers.ai.warn('Failed to parse SSE chunk', { line: trimmed, error: parseError });
            continue;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Calculate cost from usage metadata
   */
  private calculateCostFromUsage(model: string, usage: { prompt_tokens: number; completion_tokens: number }): number {
    // OpenRouter returns cost in usage metadata, but if not available, estimate
    // This is a fallback - OpenRouter usually includes cost in usage object
    const modelInfo = this.modelCache.get(model);
    if (!modelInfo) {
      // Rough estimate if model info not available
      return (usage.prompt_tokens / 1000) * 0.001 + (usage.completion_tokens / 1000) * 0.002;
    }

    const promptCost = (usage.prompt_tokens / 1000) * modelInfo.pricing.prompt;
    const completionCost = (usage.completion_tokens / 1000) * modelInfo.pricing.completion;
    return promptCost + completionCost;
  }

  /**
   * Execute agent task with optimal model
   */
  async executeAgentTask(
    agentId: string,
    systemPrompt: string,
    userPrompt: string,
    tools?: OpenRouterTool[]
  ): Promise<OpenRouterResponse> {
    // Get optimal models for this agent
    const models = AGENT_MODEL_MAP[agentId] || AGENT_MODEL_MAP['default'];
    
    const request: OpenRouterRequest = {
      model: this.config.enableAutoRouting ? 'openrouter/auto' : models[0],
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      models: this.config.enableAutoRouting ? undefined : models,
      provider: {
        allow_fallbacks: true,
        sort: 'price',
        only: this.config.preferredProviders,
        ignore: this.config.excludedProviders,
      },
      ...(tools && { tools, tool_choice: 'auto' }),
    };

    return this.chatCompletion(request);
  }

  /**
   * Get HTTP headers for OpenRouter requests
   */
  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://arkelythex.io',
      'X-Title': 'ARKELYTHEX Fiscal Platform',
    };
  }

  /**
   * Make HTTP request to OpenRouter
   */
  private async makeRequest(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Fetch available models
   */
  async fetchModels(): Promise<OpenRouterModel[]> {
    // Cache for 1 hour
    if (this.lastFetch && Date.now() - this.lastFetch.getTime() < 3600000) {
      return Array.from(this.modelCache.values());
    }

    const response = await fetch(`${this.config.baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }

    const data = await response.json();
    const models: OpenRouterModel[] = data.data;

    // Update cache
    this.modelCache.clear();
    models.forEach(model => this.modelCache.set(model.id, model));
    this.lastFetch = new Date();

    return models;
  }

  /**
   * Get model details
   */
  async getModel(modelId: string): Promise<OpenRouterModel | undefined> {
    if (this.modelCache.has(modelId)) {
      return this.modelCache.get(modelId);
    }

    await this.fetchModels();
    return this.modelCache.get(modelId);
  }

  /**
   * Get cost metrics
   */
  getCostMetrics(): CostMetrics {
    return this.costTracker.getMetrics();
  }

  /**
   * Check if within budget
   */
  isWithinBudget(): boolean {
    return this.costTracker.isWithinBudget();
  }

  /**
   * Get recommended model for task type
   */
  getRecommendedModel(taskType: string): string {
    const recommendations: Record<string, string> = {
      'code-generation': 'anthropic/claude-opus-4.5',
      'code-review': 'anthropic/claude-sonnet-4.5',
      'documentation': 'anthropic/claude-sonnet-4.5',
      'analysis': 'openai/gpt-5.1',
      'chat': 'openrouter/auto',
      'creative': 'google/gemini-3-pro-preview',
    };

    return recommendations[taskType] || 'openrouter/auto';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Cost tracking service
 */
class CostTracker {
  private totalRequests = 0;
  private totalTokens = 0;
  private totalCost = 0;
  private modelBreakdown = new Map<string, { requests: number; tokens: number; cost: number }>();
  private providerBreakdown = new Map<string, { requests: number; cost: number }>();

  constructor(private monthlyBudget: number) {}

  trackRequest(model: string, promptTokens: number, completionTokens: number, cost: number): void {
    this.totalRequests++;
    this.totalTokens += promptTokens + completionTokens;
    this.totalCost += cost;

    // Model breakdown
    const modelStats = this.modelBreakdown.get(model) || { requests: 0, tokens: 0, cost: 0 };
    modelStats.requests++;
    modelStats.tokens += promptTokens + completionTokens;
    modelStats.cost += cost;
    this.modelBreakdown.set(model, modelStats);

    // Provider breakdown (extract provider from model id)
    const provider = model.split('/')[0];
    const providerStats = this.providerBreakdown.get(provider) || { requests: 0, cost: 0 };
    providerStats.requests++;
    providerStats.cost += cost;
    this.providerBreakdown.set(provider, providerStats);
  }

  getMetrics(): CostMetrics {
    return {
      totalRequests: this.totalRequests,
      totalTokens: this.totalTokens,
      totalCost: this.totalCost,
      monthlyBudget: this.monthlyBudget,
      budgetRemaining: this.monthlyBudget - this.totalCost,
      modelBreakdown: new Map(this.modelBreakdown),
      providerBreakdown: new Map(this.providerBreakdown),
    };
  }

  isWithinBudget(): boolean {
    return this.totalCost < this.monthlyBudget;
  }
}

// Export singleton instance
/**
 * openRouter const.
 *
 * @example
 * ```ts
 * console.log(openRouter);
 * ```
 */
export const openRouter = new OpenRouterService({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  budgetLimit: parseFloat(process.env.OPENROUTER_BUDGET || '1000'),
  enableAutoRouting: true,
});

// Exports already done above
