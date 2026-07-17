import { describe, expect, it } from "vitest";
import type {
	ChatCompletionRequest,
	ChatCompletionResult,
	ChatMessage,
	EmbeddingRequest,
	EmbeddingResult,
	LLMProvider,
	ProviderConfig,
	ProviderFactory,
	StreamChunk,
	TokenUsage,
} from "../../src/ai-gateway/provider.js";

describe("LLM Provider Types", () => {
	describe("ProviderConfig", () => {
		it("accepts a minimal provider config with just name", () => {
			const config: ProviderConfig = { name: "google" };
			expect(config.name).toBe("google");
		});

		it("accepts a full provider config with all fields", () => {
			const config: ProviderConfig = {
				name: "anthropic",
				baseUrl: "https://api.anthropic.com",
				apiKey: "sk-test",
				maxRetries: 3,
				timeout: 30000,
			};
			expect(config.name).toBe("anthropic");
			expect(config.baseUrl).toBe("https://api.anthropic.com");
			expect(config.maxRetries).toBe(3);
			expect(config.timeout).toBe(30000);
		});
	});

	describe("ChatMessage", () => {
		it("creates a user message", () => {
			const msg: ChatMessage = { role: "user", content: "Hello" };
			expect(msg.role).toBe("user");
			expect(msg.content).toBe("Hello");
		});

		it("creates a system message", () => {
			const msg: ChatMessage = {
				role: "system",
				content: "You are a helpful assistant",
			};
			expect(msg.role).toBe("system");
		});

		it("creates an assistant message", () => {
			const msg: ChatMessage = {
				role: "assistant",
				content: "I can help with that",
			};
			expect(msg.role).toBe("assistant");
		});

		it("creates a tool message", () => {
			const msg: ChatMessage = { role: "tool", content: '{"result":"ok"}' };
			expect(msg.role).toBe("tool");
		});
	});

	describe("ChatCompletionRequest", () => {
		it("creates a minimal completion request", () => {
			const request: ChatCompletionRequest = {
				model: "gemini-3-flash",
				messages: [{ role: "user", content: "Hello" }],
			};
			expect(request.model).toBe("gemini-3-flash");
			expect(request.messages).toHaveLength(1);
			expect(request.messages[0].content).toBe("Hello");
		});

		it("creates a completion request with all optional fields", () => {
			const request: ChatCompletionRequest = {
				model: "claude-sonnet-4.5",
				messages: [
					{ role: "system", content: "Be concise" },
					{ role: "user", content: "Explain AI" },
				],
				temperature: 0.5,
				maxTokens: 1024,
				stop: ["\n", "END"],
			};
			expect(request.temperature).toBe(0.5);
			expect(request.maxTokens).toBe(1024);
			expect(request.stop).toEqual(["\n", "END"]);
		});
	});

	describe("ChatCompletionResult", () => {
		it("creates a completion result with minimum fields", () => {
			const result: ChatCompletionResult = {
				id: "cmpl-001",
				model: "gemini-3-flash",
				content: "Hello! How can I help?",
				finishReason: "stop",
			};
			expect(result.id).toBe("cmpl-001");
			expect(result.content).toBe("Hello! How can I help?");
			expect(result.finishReason).toBe("stop");
		});

		it("creates a result with usage tracking", () => {
			const usage: TokenUsage = {
				promptTokens: 10,
				completionTokens: 20,
				totalTokens: 30,
			};
			const result: ChatCompletionResult = {
				id: "cmpl-002",
				model: "claude-sonnet-4.5",
				content: "Sure, here's the explanation...",
				usage,
				finishReason: "stop",
			};
			expect(result.usage?.promptTokens).toBe(10);
			expect(result.usage?.totalTokens).toBe(30);
		});
	});

	describe("EmbeddingRequest", () => {
		it("creates an embedding request with a string input", () => {
			const request: EmbeddingRequest = {
				model: "text-embedding-3",
				input: "Hello world",
			};
			expect(request.model).toBe("text-embedding-3");
			expect(request.input).toBe("Hello world");
		});

		it("creates an embedding request with an array of strings", () => {
			const request: EmbeddingRequest = {
				model: "text-embedding-3",
				input: ["Hello", "World"],
			};
			expect(Array.isArray(request.input)).toBe(true);
			expect((request.input as string[]).length).toBe(2);
		});
	});

	describe("EmbeddingResult", () => {
		it("creates an embedding result with embeddings", () => {
			const result: EmbeddingResult = {
				model: "text-embedding-3",
				embeddings: [
					[0.1, 0.2, 0.3],
					[0.4, 0.5, 0.6],
				],
			};
			expect(result.model).toBe("text-embedding-3");
			expect(result.embeddings).toHaveLength(2);
			expect(result.embeddings[0]).toHaveLength(3);
		});
	});

	describe("StreamChunk", () => {
		it("creates a token stream chunk", () => {
			const chunk: StreamChunk = { type: "token", content: "Hello" };
			expect(chunk.type).toBe("token");
			expect(chunk.content).toBe("Hello");
		});

		it("creates a done stream chunk", () => {
			const chunk: StreamChunk = { type: "done", finishReason: "stop" };
			expect(chunk.type).toBe("done");
			expect(chunk.finishReason).toBe("stop");
		});

		it("creates an error stream chunk", () => {
			const chunk: StreamChunk = {
				type: "error",
				error: "Rate limit exceeded",
			};
			expect(chunk.type).toBe("error");
			expect(chunk.error).toBe("Rate limit exceeded");
		});
	});
});

describe("LLMProvider Interface", () => {
	it("defines a provider with required methods", () => {
		const provider: LLMProvider = {
			name: "test-provider",
			async generateChatCompletion(_request: ChatCompletionRequest) {
				return {
					id: "test-id",
					model: "test-model",
					content: "Test response",
					finishReason: "stop",
				};
			},
			generateStreamingCompletion(_request: ChatCompletionRequest) {
				return (async function* () {
					yield { type: "done" as const, finishReason: "stop" };
				})();
			},
			async generateEmbedding(_request: EmbeddingRequest) {
				return {
					model: "test-model",
					embeddings: [[0.1, 0.2]],
				};
			},
		};

		expect(provider.name).toBe("test-provider");
		expect(typeof provider.generateChatCompletion).toBe("function");
		expect(typeof provider.generateStreamingCompletion).toBe("function");
		expect(typeof provider.generateEmbedding).toBe("function");
	});
});

describe("ProviderFactory Interface", () => {
	it("defines a factory that creates providers", () => {
		const factory: ProviderFactory = {
			createProvider(config: ProviderConfig): LLMProvider {
				return {
					name: config.name,
					async generateChatCompletion(_request: ChatCompletionRequest) {
						return {
							id: "test",
							model: "m",
							content: "ok",
							finishReason: "stop",
						};
					},
					generateStreamingCompletion(_request: ChatCompletionRequest) {
						return (async function* () {
							yield { type: "done" as const, finishReason: "stop" };
						})();
					},
					async generateEmbedding(_request: EmbeddingRequest) {
						return { model: "m", embeddings: [] };
					},
				};
			},
			getSupportedProviders() {
				return ["google", "anthropic"];
			},
		};

		const provider = factory.createProvider({ name: "google" });
		expect(provider.name).toBe("google");
		expect(factory.getSupportedProviders()).toEqual(["google", "anthropic"]);
	});
});
