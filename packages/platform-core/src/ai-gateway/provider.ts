/**
 * LLM Provider Interface — Domain-Agnostic.
 *
 * Defines the contract for AI model providers (Google, Anthropic, OpenAI, etc.)
 * without any fiscal, tax, or vertical-specific types.
 *
 * Zero fiscal imports — all types here are shared across all verticals.
 *
 * @module @drenyra/platform-core/ai-gateway
 */

// ──────────────────────────────────────────────
// Provider Configuration
// ──────────────────────────────────────────────

/**
 * Configuration for an AI model provider.
 */
export interface ProviderConfig {
  /** Provider identifier (e.g., "google", "anthropic", "openai") */
  name: string;
  /** Base URL for the provider API */
  baseUrl?: string;
  /** API key (resolved from environment at runtime) */
  apiKey?: string;
  /** Maximum retries on provider errors */
  maxRetries?: number;
  /** Request timeout in milliseconds */
  timeout?: number;
}

// ──────────────────────────────────────────────
// Chat Completion Types
// ──────────────────────────────────────────────

/**
 * A message in a chat conversation.
 */
export interface ChatMessage {
  /** Message role */
  role: "system" | "user" | "assistant" | "tool";
  /** Message content */
  content: string;
}

/**
 * A request for chat completion.
 */
export interface ChatCompletionRequest {
  /** Model identifier to use */
  model: string;
  /** Conversation messages */
  messages: ChatMessage[];
  /** Sampling temperature (0-1, lower = more deterministic) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Sequences that stop generation */
  stop?: string[];
}

/**
 * Token usage statistics.
 */
export interface TokenUsage {
  /** Number of prompt tokens consumed */
  promptTokens: number;
  /** Number of completion tokens generated */
  completionTokens: number;
  /** Total tokens consumed */
  totalTokens: number;
}

/**
 * The result of a chat completion request.
 */
export interface ChatCompletionResult {
  /** Unique response identifier */
  id: string;
  /** Model that generated the response */
  model: string;
  /** Generated content text */
  content: string;
  /** Token usage statistics (when available) */
  usage?: TokenUsage;
  /** Reason the generation finished ("stop", "length", "error") */
  finishReason: string;
}

// ──────────────────────────────────────────────
// Embedding Types
// ──────────────────────────────────────────────

/**
 * A request for text embedding.
 */
export interface EmbeddingRequest {
  /** Model identifier for embeddings */
  model: string;
  /** Text or texts to embed */
  input: string | string[];
}

/**
 * The result of an embedding request.
 */
export interface EmbeddingResult {
  /** Model that generated the embeddings */
  model: string;
  /** Generated embedding vectors */
  embeddings: number[][];
  /** Token usage statistics (when available) */
  usage?: TokenUsage;
}

// ──────────────────────────────────────────────
// Streaming Types
// ──────────────────────────────────────────────

/**
 * A chunk of a streaming response.
 */
export interface StreamChunk {
  /** Chunk type */
  type: "token" | "done" | "error";
  /** Text content (for token chunks) */
  content?: string;
  /** Reason generation finished (for done chunks) */
  finishReason?: string;
  /** Error message (for error chunks) */
  error?: string;
}

// ──────────────────────────────────────────────
// Provider Contract
// ──────────────────────────────────────────────

/**
 * Domain-agnostic LLM provider interface.
 *
 * Every AI provider (Google, Anthropic, OpenAI, etc.) MUST implement
 * this interface to be usable by the AI Gateway.
 */
export interface LLMProvider {
  /** Provider name */
  name: string;
  /** Send a chat completion request and return the result */
  generateChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResult>;
  /** Stream a chat completion response */
  generateStreamingCompletion(request: ChatCompletionRequest): AsyncIterable<StreamChunk>;
  /** Generate embeddings for the given text */
  generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResult>;
}

// ──────────────────────────────────────────────
// Provider Factory Contract
// ──────────────────────────────────────────────

/**
 * A factory that creates LLM provider instances.
 */
export interface ProviderFactory {
  /** Create a provider instance from configuration */
  createProvider(config: ProviderConfig): LLMProvider;
  /** List supported provider names */
  getSupportedProviders(): string[];
}
