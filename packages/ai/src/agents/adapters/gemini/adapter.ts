/**
 * Gemini Multi-Instance Adapter
 * Manages multiple Gemini Flash instances for parallel processing
 *
 * Model Specs (2026):
 * - Model: gemini-2.5-flash / gemini-3-flash
 * - Context: 1M tokens
 * - Multimodal: Yes (text, images, PDF, audio)
 * - Pricing: ~$0.30-$0.50/1M input, ~$3.00/1M output
 * - Context Caching: 90% discount on repeated tokens
 *
 * @see https://ai.google.dev/gemini-api/docs
 */

import { createHash } from "node:crypto";
import type { Part } from "@google/generative-ai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { loggers } from "../../../logger";
import type { AIResponse } from "../../types";
import type { GeminiConfig, GeminiMultimodalInput } from "./types";

export class GeminiMultiAdapter {
	private genAI: GoogleGenerativeAI;
	private config: Required<GeminiConfig>;
	private cache: Map<string, { content: string; timestamp: number }>;
	private readonly CACHE_TTL = 3600 * 1000;

	private readonly INPUT_PRICE_PER_M = 0.5;
	private readonly OUTPUT_PRICE_PER_M = 3.0;
	private readonly CACHED_INPUT_PRICE_PER_M = 0.05;

	constructor(config: GeminiConfig) {
		this.config = {
			apiKey: config.apiKey,
			model: config.model || "gemini-2.5-flash",
			instanceId: config.instanceId || "default",
			maxTokens: config.maxTokens || 8192,
			temperature: config.temperature || 0.3,
			cacheEnabled: config.cacheEnabled ?? true,
		};

		if (!this.config.apiKey) {
			throw new Error("[GeminiMultiAdapter] API Key is required");
		}

		this.genAI = new GoogleGenerativeAI(this.config.apiKey);
		this.cache = new Map();

		loggers.ai.info("Gemini adapter initialized", {
			instanceId: this.config.instanceId,
			model: this.config.model,
		});
	}

	async generate(input: GeminiMultimodalInput): Promise<AIResponse> {
		const startTime = Date.now();

		if (this.config.cacheEnabled && !input.images?.length) {
			const cacheKey = this.getCacheKey(input);
			const cached = this.getFromCache(cacheKey);
			if (cached) {
				loggers.ai.info("Gemini cache hit", {
					instanceId: this.config.instanceId,
				});
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
			const model = this.genAI.getGenerativeModel({
				model: this.config.model,
				systemInstruction: input.systemInstruction,
			});

			const parts: Part[] = [];

			if (input.text) {
				parts.push({ text: input.text } as Part);
			}

			if (input.images) {
				for (const imgData of input.images) {
					const parsed = this.parseBase64Image(imgData);
					parts.push({
						inlineData: {
							mimeType: parsed.mimeType,
							data: parsed.data,
						},
					} as Part);
				}
			}

			const result = await model.generateContent(parts);
			const content = result.response.text();
			const latency = Date.now() - startTime;

			const estimatedInputTokens = this.estimateTokens(input.text || "");
			const estimatedOutputTokens = this.estimateTokens(content);
			const cost = this.calculateCost(
				estimatedInputTokens,
				estimatedOutputTokens,
				false,
			);

			if (this.config.cacheEnabled && !input.images?.length) {
				const cacheKey = this.getCacheKey(input);
				this.setCache(cacheKey, content);
			}

			loggers.ai.info("Gemini completion succeeded", {
				instanceId: this.config.instanceId,
				latency,
				tokens: estimatedInputTokens + estimatedOutputTokens,
				cost,
			});

			return {
				content,
				tokensUsed: {
					input: estimatedInputTokens,
					output: estimatedOutputTokens,
				},
				cost,
				latency,
				cached: false,
			};
		} catch (error) {
			loggers.ai.error("Gemini request failed", {
				instanceId: this.config.instanceId,
				error: error instanceof Error ? error.message : String(error),
			});
			throw new Error(
				`Gemini API error (${this.config.instanceId}): ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async extractFromImage(
		imageBase64: string,
		prompt: string = "Extract all text from this image in structured JSON format.",
	): Promise<AIResponse> {
		return this.generate({
			text: prompt,
			images: [imageBase64],
			systemInstruction:
				"You are an expert OCR system specializing in invoice and receipt extraction. Extract ALL fields accurately and return structured JSON.",
		});
	}

	async parsePDF(pdfBase64: string, schema: string): Promise<AIResponse> {
		return this.generate({
			text: `Parse this PDF document according to schema: ${schema}`,
			images: [pdfBase64],
			systemInstruction:
				"You are a document parser specialized in invoices and financial documents. Return structured JSON matching the schema.",
		});
	}

	private parseBase64Image(imgData: string): {
		mimeType: string;
		data: string;
	} {
		const matches = imgData.match(
			/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/,
		);

		if (matches && matches.length === 3) {
			return {
				mimeType: matches[1],
				data: matches[2],
			};
		}

		return {
			mimeType: "image/jpeg",
			data: imgData,
		};
	}

	private estimateTokens(text: string): number {
		return Math.ceil(text.length / 4);
	}

	private calculateCost(
		inputTokens: number,
		outputTokens: number,
		cached: boolean,
	): number {
		const inputCost =
			(inputTokens / 1_000_000) *
			(cached ? this.CACHED_INPUT_PRICE_PER_M : this.INPUT_PRICE_PER_M);
		const outputCost = (outputTokens / 1_000_000) * this.OUTPUT_PRICE_PER_M;
		return inputCost + outputCost;
	}

	private getCacheKey(input: GeminiMultimodalInput): string {
		const content = `${input.systemInstruction || ""}:${input.text || ""}`;
		return createHash("sha256").update(content).digest("hex");
	}

	private getFromCache(key: string): string | null {
		const cached = this.cache.get(key);
		if (!cached) return null;

		if (Date.now() - cached.timestamp > this.CACHE_TTL) {
			this.cache.delete(key);
			return null;
		}

		return cached.content;
	}

	private setCache(key: string, content: string): void {
		this.cache.set(key, { content, timestamp: Date.now() });

		if (this.cache.size > 100) {
			const firstKey = this.cache.keys().next().value;
			if (firstKey) {
				this.cache.delete(firstKey);
			}
		}
	}

	clearCache(): void {
		this.cache.clear();
		loggers.ai.info("Gemini cache cleared", {
			instanceId: this.config.instanceId,
		});
	}

	getInstanceId(): string {
		return this.config.instanceId;
	}

	getCacheStats(): { instanceId: string; size: number; ttl: number } {
		return {
			instanceId: this.config.instanceId,
			size: this.cache.size,
			ttl: this.CACHE_TTL,
		};
	}
}

export class GeminiInstanceFactory {
	private instances: Map<string, GeminiMultiAdapter>;
	private apiKey: string;

	constructor(apiKey: string) {
		this.apiKey = apiKey;
		this.instances = new Map();
	}

	getInstance(
		instanceId: string,
		config?: Partial<GeminiConfig>,
	): GeminiMultiAdapter {
		if (this.instances.has(instanceId)) {
			return this.instances.get(instanceId)!;
		}

		const instance = new GeminiMultiAdapter({
			apiKey: this.apiKey,
			instanceId,
			...config,
		});

		this.instances.set(instanceId, instance);
		return instance;
	}

	getAllInstances(): Map<string, GeminiMultiAdapter> {
		return this.instances;
	}

	clearAllCaches(): void {
		for (const instance of this.instances.values()) {
			instance.clearCache();
		}
		loggers.ai.info("Gemini factory caches cleared");
	}

	getStats(): Array<{ instanceId: string; size: number; ttl: number }> {
		return Array.from(this.instances.values()).map((instance) =>
			instance.getCacheStats(),
		);
	}
}
