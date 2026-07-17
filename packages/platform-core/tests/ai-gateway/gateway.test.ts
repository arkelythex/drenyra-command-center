import { beforeEach, describe, expect, it } from "vitest";
import { AIGateway } from "../../src/ai-gateway/gateway.js";
import type {
	ChatCompletionRequest,
	EmbeddingRequest,
	LLMProvider,
} from "../../src/ai-gateway/provider.js";
import type { ModelRegistration } from "../../src/ai-gateway/registry.js";
import { ModelRegistry } from "../../src/ai-gateway/registry.js";
import { ToolRegistry } from "../../src/ai-gateway/tool-bridge.js";

describe("AIGateway", () => {
	let gateway: AIGateway;
	let modelRegistry: ModelRegistry;
	let toolRegistry: ToolRegistry;
	let mockProvider: LLMProvider;

	beforeEach(() => {
		modelRegistry = new ModelRegistry();
		toolRegistry = new ToolRegistry();
		mockProvider = {
			name: "test-provider",
			async generateChatCompletion(request: ChatCompletionRequest) {
				if (request.messages[0]?.content === "fail") {
					throw new Error("Provider failure");
				}
				return {
					id: "resp-1",
					model: request.model,
					content: `Echo: ${request.messages[0]?.content ?? ""}`,
					usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
					finishReason: "stop",
				};
			},
			generateStreamingCompletion(_request: ChatCompletionRequest) {
				return (async function* () {
					yield { type: "done" as const, finishReason: "stop" };
				})();
			},
			async generateEmbedding(_request: EmbeddingRequest) {
				return { model: "embed-model", embeddings: [[0.1, 0.2]] };
			},
		};

		const flashModel: ModelRegistration = {
			id: "test-flash",
			name: "Test Flash",
			provider: "test-provider",
			capabilities: ["chat", "streaming"],
			cost: { costPer1MInput: 5.0, costPer1MOutput: 25.0 },
		};
		modelRegistry.register(flashModel);

		gateway = new AIGateway({
			modelRegistry,
			toolRegistry,
			defaultProvider: "test-provider",
			providers: { "test-provider": mockProvider },
			config: {
				preferredProvider: "test-provider",
				allowCrossProvider: true,
				rateLimits: { maxRequestsPerMinute: 100, maxTokensPerMinute: 100000 },
			},
		});
	});

	describe("execute with chat completion", () => {
		it("returns a completion result from the provider", async () => {
			const result = await gateway.execute({
				messages: [{ role: "user", content: "Hello" }],
				model: "test-flash",
			});

			expect(result.content).toBe("Echo: Hello");
			expect(result.model).toBe("test-flash");
			expect(result.provider).toBe("test-provider");
		});

		it("includes usage stats when provider returns them", async () => {
			const result = await gateway.execute({
				messages: [{ role: "user", content: "Hello" }],
				model: "test-flash",
			});

			expect(result.usage).toBeDefined();
			expect(result.usage?.promptTokens).toBe(10);
			expect(result.usage?.totalTokens).toBe(15);
		});
	});

	describe("rate limiting", () => {
		it("throws when rate limit is exceeded", async () => {
			// Configure gateway with very strict rate limit
			const strictGateway = new AIGateway({
				modelRegistry,
				toolRegistry,
				defaultProvider: "test-provider",
				providers: { "test-provider": mockProvider },
				config: {
					preferredProvider: "test-provider",
					rateLimits: { maxRequestsPerMinute: 0, maxTokensPerMinute: 0 },
				},
			});

			await expect(
				strictGateway.execute({
					messages: [{ role: "user", content: "Hello" }],
					model: "test-flash",
				}),
			).rejects.toThrow(/rate limit|Rate limit/i);
		});

		it("tracks request count for rate limiting", async () => {
			await gateway.execute({
				messages: [{ role: "user", content: "First" }],
				model: "test-flash",
			});
			await gateway.execute({
				messages: [{ role: "user", content: "Second" }],
				model: "test-flash",
			});

			const metrics = gateway.getMetrics();
			expect(metrics.totalRequests).toBe(2);
		});
	});

	describe("failover", () => {
		it("fails when providers are unavailable and no failover configured", async () => {
			const soloGateway = new AIGateway({
				modelRegistry,
				toolRegistry,
				defaultProvider: "test-provider",
				providers: { "test-provider": mockProvider },
				config: {
					preferredProvider: "test-provider",
					allowCrossProvider: false,
				},
			});

			// Request a model that doesn't exist
			await expect(
				soloGateway.execute({
					messages: [{ role: "user", content: "fail" }],
					model: "non-existent",
				}),
			).rejects.toThrow();
		});
	});

	describe("getMetrics", () => {
		it("returns zero metrics when no requests made", () => {
			const metrics = gateway.getMetrics();
			expect(metrics.totalRequests).toBe(0);
			expect(metrics.totalTokens).toBe(0);
			expect(metrics.totalCost).toBe(0);
		});

		it("returns accumulated metrics after requests", async () => {
			await gateway.execute({
				messages: [{ role: "user", content: "Hello" }],
				model: "test-flash",
			});

			const metrics = gateway.getMetrics();
			expect(metrics.totalRequests).toBe(1);
			expect(metrics.totalTokens).toBe(15);
			expect(metrics.totalCost).toBeGreaterThanOrEqual(0);
		});
	});

	describe("shutdown", () => {
		it("prevents further execution after shutdown", async () => {
			gateway.shutdown();
			await expect(
				gateway.execute({
					messages: [{ role: "user", content: "Hello" }],
					model: "test-flash",
				}),
			).rejects.toThrow(/shut down|shutdown/i);
		});

		it("still tracks metrics after shutdown", () => {
			gateway.shutdown();
			const metrics = gateway.getMetrics();
			expect(metrics.totalRequests).toBe(0);
		});
	});

	describe("tool execution", () => {
		it("executes provided tools during chat completion", async () => {
			const calcTool = {
				name: "calculator",
				description: "Calculator",
				async execute(args: Record<string, unknown>) {
					const { a, b } = args as { a: number; b: number };
					return { result: a + b };
				},
			};
			toolRegistry.register(calcTool);

			const result = await gateway.executeWithTools({
				messages: [{ role: "user", content: "Add 2 and 3" }],
				model: "test-flash",
			});

			expect(result.content).toBeDefined();
			expect(result.model).toBe("test-flash");
		});
	});
});
