/**
 * Grok Adapter (xAI)
 * Adapter for xAI's Grok Code Fast 1 model
 *
 * Model Specs (2026):
 * - Model: grok-code-fast-1
 * - Context: 256K tokens
 * - Speed: 190 tokens/sec
 * - Pricing: $0.20/1M input, $1.50/1M output, $0.02/1M cached
 * - Specialization: Code generation and validation
 *
 * @see https://docs.x.ai/docs/models/grok-code-fast-1
 */

import { createHash } from 'crypto';
import type { AIResponse } from '../types';
import { loggers } from '../../logger';

/**
 * GrokConfig interface.
 *
 * @example
 * ```ts
 * const value: GrokConfig = {} as GrokConfig;
 * console.log(value);
 * ```
 */
export interface GrokConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  cacheEnabled?: boolean;
  baseURL?: string;
}

/**
 * GrokMessage interface.
 *
 * @example
 * ```ts
 * const value: GrokMessage = {} as GrokMessage;
 * console.log(value);
 * ```
 */
export interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * GrokCompletionRequest interface.
 *
 * @example
 * ```ts
 * const value: GrokCompletionRequest = {} as GrokCompletionRequest;
 * console.log(value);
 * ```
 */
export interface GrokCompletionRequest {
  model: string;
  messages: GrokMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

/**
 * GrokCompletionResponse interface.
 *
 * @example
 * ```ts
 * const value: GrokCompletionResponse = {} as GrokCompletionResponse;
 * console.log(value);
 * ```
 */
export interface GrokCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * GrokAdapter class.
 *
 * @example
 * ```ts
 * const value = new GrokAdapter();
 * console.log(value);
 * ```
 */
export class GrokAdapter {
  private config: Required<GrokConfig>;
  private cache: Map<string, { content: string; timestamp: number }>;
  private readonly CACHE_TTL = 3600 * 1000; // 1 hour

  // Pricing per million tokens (as of 2026)
  private readonly INPUT_PRICE_PER_M = 0.20;
  private readonly OUTPUT_PRICE_PER_M = 1.50;
  private readonly CACHED_INPUT_PRICE_PER_M = 0.02;

  constructor(config: GrokConfig) {
    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'grok-code-fast-1',
      maxTokens: config.maxTokens || 4096,
      temperature: config.temperature || 0.1, // Low temp for code validation
      cacheEnabled: config.cacheEnabled ?? true,
      baseURL: config.baseURL || 'https://api.x.ai/v1',
    };

    this.cache = new Map();

    if (!this.config.apiKey) {
      loggers.ai.warn('GrokAdapter initialized without API key');
    }
  }

  /**
   * Generate completion using Grok
   */
  async complete(messages: GrokMessage[]): Promise<AIResponse> {
    const startTime = Date.now();

    // Check cache first
    const cacheKey = this.getCacheKey(messages);
    if (this.config.cacheEnabled) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        loggers.ai.info('Grok cache hit');
        return {
          content: cached,
          tokensUsed: { input: 0, output: 0 },
          cost: 0,
          latency: Date.now() - startTime,
          cached: true,
        };
      }
    }

    try {
      const response = await this.callGrokAPI(messages);
      const content = response.choices[0]?.message?.content || '';
      const latency = Date.now() - startTime;

      // Calculate cost
      const inputTokens = response.usage.prompt_tokens;
      const outputTokens = response.usage.completion_tokens;
      const cost = this.calculateCost(inputTokens, outputTokens, false);

      // Cache the response
      if (this.config.cacheEnabled && content) {
        this.setCache(cacheKey, content);
      }

      loggers.ai.info('Grok completion succeeded', {
        latency,
        tokens: inputTokens + outputTokens,
        cost,
      });

      return {
        content,
        tokensUsed: { input: inputTokens, output: outputTokens },
        cost,
        latency,
        cached: false,
      };
    } catch (error) {
      loggers.ai.error('Grok API request failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Grok API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate code validation using system prompt
   */
  async validateCode(
    code: string,
    context: string,
    systemPrompt?: string
  ): Promise<AIResponse> {
    const messages: GrokMessage[] = [
      {
        role: 'system',
        content: systemPrompt || 'You are an expert code validator specializing in XML generation and SUNAT compliance.',
      },
      {
        role: 'user',
        content: `Context: ${context}\n\nCode to validate:\n\`\`\`xml\n${code}\n\`\`\`\n\nProvide validation results in JSON format.`,
      },
    ];

    return this.complete(messages);
  }

  /**
   * Generate XML based on invoice data
   */
  async generateXML(
    invoiceData: Record<string, unknown>,
    schema: 'UBL_2.0' | 'UBL_2.1',
    systemPrompt?: string
  ): Promise<AIResponse> {
    const messages: GrokMessage[] = [
      {
        role: 'system',
        content:
          systemPrompt ||
          `You are an expert in SUNAT UBL ${schema} XML generation for Peru.
Generate valid, compliant XML according to SUNAT specifications.
Include proper namespaces, digital signature placeholders, and all required fields.`,
      },
      {
        role: 'user',
        content: `Generate UBL ${schema} XML for this invoice data:\n\n${JSON.stringify(invoiceData, null, 2)}`,
      },
    ];

    return this.complete(messages);
  }

  /**
   * Call Grok API using OpenAI-compatible endpoint
   */
  private async callGrokAPI(messages: GrokMessage[]): Promise<GrokCompletionResponse> {
    const requestBody: GrokCompletionRequest = {
      model: this.config.model,
      messages,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      stream: false,
    };

    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Grok API HTTP ${response.status}: ${errorText}`);
    }

    return response.json() as Promise<GrokCompletionResponse>;
  }

  /**
   * Calculate cost based on token usage
   */
  private calculateCost(inputTokens: number, outputTokens: number, cached: boolean): number {
    const inputCost = (inputTokens / 1_000_000) * (cached ? this.CACHED_INPUT_PRICE_PER_M : this.INPUT_PRICE_PER_M);
    const outputCost = (outputTokens / 1_000_000) * this.OUTPUT_PRICE_PER_M;
    return inputCost + outputCost;
  }

  /**
   * Generate cache key from messages
   */
  private getCacheKey(messages: GrokMessage[]): string {
    const content = messages.map((m) => `${m.role}:${m.content}`).join('|');
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get from cache
   */
  private getFromCache(key: string): string | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.content;
  }

  /**
   * Set cache
   */
  private setCache(key: string, content: string): void {
    this.cache.set(key, { content, timestamp: Date.now() });

    // Simple cache cleanup (remove oldest if > 100 entries)
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    loggers.ai.info('Grok cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; ttl: number } {
    return {
      size: this.cache.size,
      ttl: this.CACHE_TTL,
    };
  }
}
