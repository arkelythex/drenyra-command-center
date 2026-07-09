import { generateText } from "ai";
export const DEFAULT_RERANKER_CONFIG = {
	model: "bge-reranker-v2-m3",
	topK: 5,
	minScore: 0.3,
};
export class RerankerService {
	config;
	constructor(config = {}) {
		this.config = { ...DEFAULT_RERANKER_CONFIG, ...config };
	}
	async rerank(query, chunks) {
		if (chunks.length === 0) {
			return [];
		}
		const results = await Promise.all(
			chunks.map(async (chunk, index) => {
				const score = await this.scoreRelevance(query, chunk.content);
				return {
					chunkId: chunk.id,
					originalIndex: index,
					score,
				};
			}),
		);
		results.sort((a, b) => b.score - a.score);
		return results.slice(0, this.config.topK);
	}
	async scoreRelevance(query, document) {
		try {
			const { text } = await generateText({
				model: "openai:gpt-4o-mini",
				prompt: `You are a relevance scorer. Rate how relevant the document is to the query on a scale of 0 to 1. 
Only respond with a single number between 0 and 1, no explanation.

Query: ${query}

Document: ${document.slice(0, 2000)}`,
			});
			const score = parseFloat(text.trim());
			if (isNaN(score) || score < 0 || score > 1) {
				return 0.5;
			}
			return score;
		} catch {
			return 0.5;
		}
	}
	getConfig() {
		return { ...this.config };
	}
}
export const rerankerService = new RerankerService();
