export const DEFAULT_SEARCH_OPTIONS = {
	topK: 20,
	finalK: 5,
	minScore: 0.5,
	hybridSearch: true,
	denseWeight: 0.7,
	rerank: true,
	includeContext: true,
	contextWindow: 1,
};
export const DEFAULT_CHUNKING_CONFIG = {
	targetChunkSize: 512,
	maxChunkSize: 1024,
	minChunkSize: 100,
	overlapSize: 50,
	semanticSplit: true,
	preserveArticles: true,
	preserveParagraphs: true,
};
export const DEFAULT_EMBEDDING_CONFIG = {
	model: "text-embedding-3-large",
	dimensions: 3072,
	batchSize: 100,
	normalizeVectors: true,
};
export const DEFAULT_RERANKER_CONFIG = {
	model: "BAAI/bge-reranker-v2-m3",
	topK: 5,
	minScore: 0.3,
	batchSize: 50,
};
export class RAGError extends Error {
	code;
	details;
	constructor(message, code, details) {
		super(message);
		this.code = code;
		this.details = details;
		this.name = "RAGError";
	}
}
