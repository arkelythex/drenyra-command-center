export interface ProviderConfig {
    name: string;
    baseUrl?: string;
    apiKey?: string;
    maxRetries?: number;
    timeout?: number;
}
export interface ChatMessage {
    role: "system" | "user" | "assistant" | "tool";
    content: string;
}
export interface ChatCompletionRequest {
    model: string;
    messages: ChatMessage[];
    temperature?: number;
    maxTokens?: number;
    stop?: string[];
}
export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}
export interface ChatCompletionResult {
    id: string;
    model: string;
    content: string;
    usage?: TokenUsage;
    finishReason: string;
}
export interface EmbeddingRequest {
    model: string;
    input: string | string[];
}
export interface EmbeddingResult {
    model: string;
    embeddings: number[][];
    usage?: TokenUsage;
}
export interface StreamChunk {
    type: "token" | "done" | "error";
    content?: string;
    finishReason?: string;
    error?: string;
}
export interface LLMProvider {
    name: string;
    generateChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResult>;
    generateStreamingCompletion(request: ChatCompletionRequest): AsyncIterable<StreamChunk>;
    generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResult>;
}
export interface ProviderFactory {
    createProvider(config: ProviderConfig): LLMProvider;
    getSupportedProviders(): string[];
}
//# sourceMappingURL=provider.d.ts.map