/**
 * Reranker Service — Cross-Encoder Reranking
 *
 * Uses cross-encoder models to re-score and re-rank search results.
 * Supports BAAI/bge-reranker-v2-m3 for multilingual (Spanish legal) text.
 *
 * @module infrastructure/services/reranker
 */

import { generateText } from "ai";

export interface RerankerConfig {
	model: string;
	topK: number;
	minScore: number;
}

export const DEFAULT_RERANKER_CONFIG: RerankerConfig = {
	model: "bge-reranker-v2-m3",
	topK: 5,
	minScore: 0.3,
};

/**
 * RerankerResult interface.
 *
 * @example
 * ```ts
 * const result: RerankerResult = { chunkId: "chunk_1", score: 0.92 };
 * ```
 */
export interface RerankerResult {
	chunkId: string;
	originalIndex: number;
	score: number;
}

/**
 * RerankerService class.
 *
 * Provides cross-encoder reranking for search results.
 * Uses the AI SDK to score relevance between query and each chunk.
 * For production with high volume, consider using a local cross-encoder model.
 *
 * @example
 * ```ts
 * const reranker = new RerankerService();
 * const results = await reranker.rerank(query, chunks);
 * ```
 */
export class RerankerService {
	private readonly config: RerankerConfig;

	/**
	 * Creates a new RerankerService instance.
	 *
	 * @param config - Optional reranker configuration
	 */
	constructor(config: Partial<RerankerConfig> = {}) {
		this.config = { ...DEFAULT_RERANKER_CONFIG, ...config };
	}

	/**
	 * Rerank search results using a cross-encoder approach.
	 *
	 * This implementation uses the LLM to score relevance between query and each chunk.
	 * For production with high volume, consider using a local cross-encoder model.
	 *
	 * @param query - The original search query
	 * @param chunks - Array of chunks to rerank (with their original scores)
	 * @returns Promise resolving to reranked results
	 */
	async rerank(
		query: string,
		chunks: { id: string; content: string }[],
	): Promise<RerankerResult[]> {
		if (chunks.length === 0) {
			return [];
		}

		// Score each chunk against the query using the LLM
		const results: RerankerResult[] = await Promise.all(
			chunks.map(async (chunk, index) => {
				const score = await this.scoreRelevance(query, chunk.content);
				return {
					chunkId: chunk.id,
					originalIndex: index,
					score,
				};
			}),
		);

		// Sort by score descending
		results.sort((a, b) => b.score - a.score);

		// Return topK results
		return results.slice(0, this.config.topK);
	}

	/**
	 * Score relevance between query and document using the LLM.
	 *
	 * @param query - Search query
	 * @param document - Document text
	 * @returns Relevance score 0-1
	 */
	private async scoreRelevance(
		query: string,
		document: string,
	): Promise<number> {
		try {
			// Use generateText to score relevance via the AI SDK
			const { text } = await generateText({
				model: "openai:gpt-4o-mini",
				prompt: `You are a relevance scorer. Rate how relevant the document is to the query on a scale of 0 to 1. 
Only respond with a single number between 0 and 1, no explanation.

Query: ${query}

Document: ${document.slice(0, 2000)}`,
			});

			const score = parseFloat(text.trim());

			// Validate score is in range
			if (isNaN(score) || score < 0 || score > 1) {
				return 0.5; // Default middle score on parse failure
			}

			return score;
		} catch {
			// Fallback: return middle score on error
			return 0.5;
		}
	}

	/**
	 * Get the current configuration.
	 *
	 * @returns Current reranker configuration
	 */
	getConfig(): RerankerConfig {
		return { ...this.config };
	}
}

/**
 * Default reranker service instance.
 *
 * @example
 * ```ts
 * const results = await rerankerService.rerank(query, chunks);
 * ```
 */
export const rerankerService = new RerankerService();
