/**
 * Ollama Client Unit Tests
 *
 * Tests for the Ollama local provider client.
 * Uses mocked fetch to test all methods without a real Ollama instance.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LLMGatewayError } from "../../src/gateway/types";
import { OllamaClient } from "../../src/providers/ollama-client";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("OllamaClient", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("constructor", () => {
		it("should use default config when none provided", () => {
			const client = new OllamaClient();
			expect(client).toBeDefined();
		});

		it("should accept custom config", () => {
			const client = new OllamaClient({
				baseUrl: "http://custom-host:11435",
				defaultModel: "mistral",
			});
			expect(client).toBeDefined();
		});

		it("should throw on invalid URL", () => {
			expect(() => new OllamaClient({ baseUrl: "not-a-url" })).toThrow(
				LLMGatewayError,
			);
		});
	});

	describe("listModels()", () => {
		it("should return models from /api/tags on success", async () => {
			const mockResponse = {
				models: [
					{ name: "llama3", modified_at: "2024-01-01", size: 4200000000 },
					{ name: "mistral", modified_at: "2024-01-02", size: 7600000000 },
				],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const client = new OllamaClient();
			const result = await client.listModels();

			expect(result.models).toHaveLength(2);
			expect(result.models[0].name).toBe("llama3");
			expect(result.models[1].name).toBe("mistral");
			expect(mockFetch).toHaveBeenCalledWith(
				"http://localhost:11434/api/tags",
				expect.objectContaining({ method: "GET" }),
			);
		});

		it("should return empty models array when no models available", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ models: [] }),
			});

			const client = new OllamaClient();
			const result = await client.listModels();

			expect(result.models).toHaveLength(0);
		});

		it("should throw PROVIDER_UNAVAILABLE on connection error", async () => {
			mockFetch.mockRejectedValueOnce(new Error("Connection refused"));

			const client = new OllamaClient();

			const promise = client.listModels();
			await expect(promise).rejects.toThrow(LLMGatewayError);
			await expect(promise).rejects.toMatchObject({
				code: "PROVIDER_UNAVAILABLE",
				provider: "ollama",
			});
		});

		it("should throw PROVIDER_ERROR on non-ok response", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
			});

			const client = new OllamaClient();

			const promise = client.listModels();
			await expect(promise).rejects.toThrow(LLMGatewayError);
			await expect(promise).rejects.toMatchObject({
				code: "PROVIDER_ERROR",
				statusCode: 500,
			});
		});
	});

	describe("healthCheck()", () => {
		it("should return healthy with models on success", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({
						models: [
							{ name: "llama3", modified_at: "2024-01-01", size: 4200000000 },
						],
					}),
			});

			const client = new OllamaClient();
			const result = await client.healthCheck();

			expect(result.healthy).toBe(true);
			expect(result.models).toContain("llama3");
			expect(result.error).toBeUndefined();
		});

		it("should return unhealthy with error on failure", async () => {
			mockFetch.mockRejectedValueOnce(new Error("Connection refused"));

			const client = new OllamaClient();
			const result = await client.healthCheck();

			expect(result.healthy).toBe(false);
			expect(result.error).toBeDefined();
			expect(result.models).toBeUndefined();
		});
	});

	describe("chat()", () => {
		it("should return chat completion response on success", async () => {
			const mockTagsResponse = {
				models: [
					{ name: "llama3", modified_at: "2024-01-01", size: 4200000000 },
				],
			};
			const mockChatResponse = {
				id: "chatcmpl-123",
				created: 1704067200,
				model: "llama3",
				choices: [
					{
						index: 0,
						message: { role: "assistant", content: "Hello!" },
						finish_reason: "stop",
					},
				],
				usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
			};

			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve(mockTagsResponse),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve(mockChatResponse),
				});

			const client = new OllamaClient();
			const result = await client.chat({
				model: "llama3",
				messages: [{ role: "user", content: "Hello" }],
			});

			expect(result.provider).toBe("ollama");
			expect(result.choices[0].message.content).toBe("Hello!");
			expect(result.usage.totalTokens).toBe(15);
		});

		it("should throw INVALID_MODEL when model not available", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ models: [{ name: "llama3" }] }),
			});

			const client = new OllamaClient();

			const promise = client.chat({
				model: "nonexistent-model",
				messages: [{ role: "user", content: "Hello" }],
			});
			await expect(promise).rejects.toThrow(LLMGatewayError);
			await expect(promise).rejects.toMatchObject({
				code: "INVALID_MODEL",
				provider: "ollama",
			});
		});

		it("should throw PROVIDER_UNAVAILABLE on connection error", async () => {
			mockFetch.mockRejectedValueOnce(new Error("Connection refused"));

			const client = new OllamaClient();

			const promise = client.chat({
				model: "llama3",
				messages: [{ role: "user", content: "Hello" }],
			});
			await expect(promise).rejects.toThrow(LLMGatewayError);
			await expect(promise).rejects.toMatchObject({
				code: "PROVIDER_UNAVAILABLE",
				provider: "ollama",
			});
		});
	});

	describe("streamChat()", () => {
		it("should yield stream chunks on success", async () => {
			const mockTagsResponse = {
				models: [
					{ name: "llama3", modified_at: "2024-01-01", size: 4200000000 },
				],
			};

			const mockStreamData = [
				'data: {"id":"chatcmpl-123","created":1704067200,"model":"llama3","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}',
				'data: {"id":"chatcmpl-123","created":1704067200,"model":"llama3","choices":[{"index":0,"delta":{"content":" world"},"finish_reason":null}]}',
				"data: [DONE]",
			];

			const mockStream = new ReadableStream({
				start(controller) {
					const encoder = new TextEncoder();
					for (const line of mockStreamData) {
						controller.enqueue(encoder.encode(`${line}\n`));
					}
					controller.close();
				},
			});

			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve(mockTagsResponse),
				})
				.mockResolvedValueOnce({
					ok: true,
					body: mockStream,
				});

			const client = new OllamaClient();
			const generator = client.streamChat({
				model: "llama3",
				messages: [{ role: "user", content: "Hello" }],
				stream: true,
			});

			const chunks: Array<{ content?: string }> = [];
			for await (const chunk of generator) {
				chunks.push({ content: chunk.choices[0]?.delta?.content });
			}

			expect(chunks).toHaveLength(2);
			expect(chunks[0].content).toBe("Hello");
			expect(chunks[1].content).toBe(" world");
		});

		it("should handle Ollama native done: true format", async () => {
			const mockTagsResponse = {
				models: [
					{ name: "llama3", modified_at: "2024-01-01", size: 4200000000 },
				],
			};

			const mockStreamData = [
				'data: {"id":"chatcmpl-123","created":1704067200,"model":"llama3","choices":[{"index":0,"delta":{"content":"Hi"},"finish_reason":null}]}',
				'data: {"done":true}',
			];

			const mockStream = new ReadableStream({
				start(controller) {
					const encoder = new TextEncoder();
					for (const line of mockStreamData) {
						controller.enqueue(encoder.encode(`${line}\n`));
					}
					controller.close();
				},
			});

			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve(mockTagsResponse),
				})
				.mockResolvedValueOnce({
					ok: true,
					body: mockStream,
				});

			const client = new OllamaClient();
			const generator = client.streamChat({
				model: "llama3",
				messages: [{ role: "user", content: "Hello" }],
				stream: true,
			});

			const chunks: unknown[] = [];
			for await (const chunk of generator) {
				chunks.push(chunk);
			}

			expect(chunks).toHaveLength(1);
		});
	});
});
