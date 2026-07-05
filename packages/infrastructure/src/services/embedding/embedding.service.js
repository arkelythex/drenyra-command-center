import { embed } from "ai";
import { DEFAULT_EMBEDDING_CONFIG } from "../../ai/rag/types";
export class EmbeddingService {
	config;
	constructor(config = {}) {
		this.config = { ...DEFAULT_EMBEDDING_CONFIG, ...config };
	}
	resolveModelId() {
		return `openai/${this.config.model}`;
	}
	async generate(text) {
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
	async generateBatch(texts) {
		const embeddings = [];
		for (let i = 0; i < texts.length; i += this.config.batchSize) {
			const batch = texts.slice(i, i + this.config.batchSize);
			const batchEmbeddings = await Promise.all(
				batch.map(async (text) => {
					return this.generate(text);
				}),
			);
			embeddings.push(...batchEmbeddings);
		}
		return embeddings;
	}
	getConfig() {
		return { ...this.config };
	}
}
export const embeddingService = new EmbeddingService();
//# sourceMappingURL=embedding.service.js.map
