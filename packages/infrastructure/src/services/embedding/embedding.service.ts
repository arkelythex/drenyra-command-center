/**
 * Embedding Generation Service
 *
 * Generates vector embeddings for semantic search using the AI SDK.
 * Supports text-embedding-3-large (3072 dimensions) with fallback models.
 *
 * @module infrastructure/services/embedding
 */

import { embed } from "ai";
import { DEFAULT_EMBEDDING_CONFIG } from "../../ai/rag/types";

/**
 * EmbeddingService class.
 *
 * Provides methods to generate embeddings for text chunks using OpenAI's embedding models.
 * Supports batch processing and fallback models.
 *
 * @example
 * ```ts
 * const embeddingService = new EmbeddingService();
 * const embedding = await embeddingService.generate("detracciones SUNAT servicios");
 * console.log(embedding.length); // 3072
 * ```
 */
export class EmbeddingService {
	private readonly config: typeof DEFAULT_EMBEDDING_CONFIG;

	/**
	 * Creates a new EmbeddingService instance.
	 *
	 * @param config - Optional embedding configuration
	 */
	constructor(config: Partial<typeof DEFAULT_EMBEDDING_CONFIG> = {}) {
		this.config = { ...DEFAULT_EMBEDDING_CONFIG, ...config };
	}

	private resolveModelId(): string {
		return `openai/${this.config.model}`;
	}

	/**
	 * Generate embedding for a single text input.
	 *
	 * @param text - The text to embed
	 * @returns Promise resolving to embedding vector array
	 */
	async generate(text: string): Promise<number[]> {
		const result = await embed({
			model: this.resolveModelId(),
			value: text,
			providerOptions: {
				openai: {
					dimensions: this.config.dimensions,
				},
			},
		});

		return result.embedding;
	}

	/**
	 * Generate embeddings for multiple texts in a batch.
	 * Processes texts in batches to respect rate limits.
	 *
	 * @param texts - Array of texts to embed
	 * @returns Promise resolving to array of embedding vectors
	 */
	async generateBatch(texts: string[]): Promise<number[][]> {
		const embeddings: number[][] = [];

		// Process in batches
		for (let i = 0; i < texts.length; i += this.config.batchSize) {
			const batch = texts.slice(i, i + this.config.batchSize);

			// Process each text in the batch
			const batchEmbeddings = await Promise.all(
				batch.map(async (text) => {
					return this.generate(text);
				}),
			);

			embeddings.push(...batchEmbeddings);
		}

		return embeddings;
	}

	/**
	 * Get the current configuration.
	 *
	 * @returns Current embedding configuration
	 */
	getConfig(): typeof DEFAULT_EMBEDDING_CONFIG {
		return { ...this.config };
	}
}

/**
 * Default embedding service instance.
 *
 * @example
 * ```ts
 * const embedding = await embeddingService.generate("SUNAT detracciones");
 * ```
 */
export const embeddingService = new EmbeddingService();
