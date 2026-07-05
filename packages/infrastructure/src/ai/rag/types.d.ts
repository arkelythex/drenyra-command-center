export type LegalDocumentType =
	| "CODIGO_TRIBUTARIO"
	| "LEY_IMPUESTO_RENTA"
	| "LEY_IGV"
	| "RTF"
	| "DECRETO_SUPREMO"
	| "DECRETO_LEGISLATIVO"
	| "RESOLUCION_SUNAT"
	| "INFORME_SUNAT"
	| "PCGE"
	| "NIC"
	| "NIIF";
export interface LegalDocument {
	id: string;
	type: LegalDocumentType;
	title: string;
	reference: string;
	publishedDate: Date;
	effectiveDate?: Date;
	summary?: string;
	fullContent: string;
	sourceUrl?: string;
	metadata: DocumentMetadata;
}
export interface DocumentMetadata {
	version: number;
	lastUpdated: Date;
	supersededBy?: string;
	relatedDocuments?: string[];
	keywords: string[];
	applicableTo?: string[];
}
export interface SemanticChunk {
	id: string;
	documentId: string;
	documentType: LegalDocumentType;
	documentReference: string;
	content: string;
	summary?: string;
	chunkIndex: number;
	startPosition: number;
	endPosition: number;
	section?: string;
	subsection?: string;
	articleNumber?: string;
	paragraphNumber?: string;
	embedding?: number[];
	embeddingModel?: string;
	parentChunkId?: string;
	childChunkIds?: string[];
	relatedChunkIds?: string[];
	keywords: string[];
	entities: ExtractedEntity[];
	createdAt: Date;
	updatedAt: Date;
}
export interface ExtractedEntity {
	type: "ARTICLE" | "AMOUNT" | "PERCENTAGE" | "DATE" | "RUC" | "CONCEPT";
	value: string;
	normalizedValue?: string;
	startPosition: number;
	endPosition: number;
}
export interface RAGQuery {
	query: string;
	filters?: RAGFilters;
	options?: RAGSearchOptions;
}
export interface RAGFilters {
	documentTypes?: LegalDocumentType[];
	dateRange?: {
		from?: Date;
		to?: Date;
	};
	keywords?: string[];
	articleNumbers?: string[];
	excludeSuperseded?: boolean;
}
export interface RAGSearchOptions {
	topK: number;
	finalK: number;
	minScore: number;
	hybridSearch: boolean;
	denseWeight: number;
	rerank: boolean;
	includeContext: boolean;
	contextWindow: number;
}
export declare const DEFAULT_SEARCH_OPTIONS: RAGSearchOptions;
export interface RAGSearchResult {
	chunk: SemanticChunk;
	scores: SearchScores;
	citation: Citation;
	context?: ContextChunks;
}
export interface SearchScores {
	bm25Score: number;
	denseScore: number;
	hybridScore: number;
	rerankScore?: number;
	finalScore: number;
}
export interface Citation {
	text: string;
	reference: string;
	section?: string;
	chunkId: string;
	sourceUrl?: string;
}
export interface ContextChunks {
	before: SemanticChunk[];
	after: SemanticChunk[];
}
export interface RAGSearchResponse {
	query: RAGQuery;
	results: RAGSearchResult[];
	metadata: SearchMetadata;
}
export interface SearchMetadata {
	totalFound: number;
	searchTimeMs: number;
	embeddingTimeMs: number;
	rerankTimeMs?: number;
	modelUsed: string;
	searchStrategy: "dense" | "bm25" | "hybrid";
}
export interface RAGContext {
	formattedContext: string;
	sourceChunks: RAGSearchResult[];
	tokenCount: number;
	citations: Citation[];
}
export interface RAGGenerationRequest {
	query: string;
	context: RAGContext;
	systemPrompt?: string;
	temperature?: number;
	maxTokens?: number;
}
export interface RAGGenerationResponse {
	answer: string;
	citations: InlineCitation[];
	confidence: number;
	metadata: GenerationMetadata;
}
export interface InlineCitation {
	startPosition: number;
	endPosition: number;
	citedText: string;
	citation: Citation;
}
export interface GenerationMetadata {
	model: string;
	promptTokens: number;
	completionTokens: number;
	totalTokens: number;
	latencyMs: number;
	contextChunksUsed: number;
}
export interface ChunkingConfig {
	targetChunkSize: number;
	maxChunkSize: number;
	minChunkSize: number;
	overlapSize: number;
	semanticSplit: boolean;
	preserveArticles: boolean;
	preserveParagraphs: boolean;
}
export declare const DEFAULT_CHUNKING_CONFIG: ChunkingConfig;
export type EmbeddingModel =
	| "text-embedding-3-large"
	| "text-embedding-3-small"
	| "bge-m3"
	| "multilingual-e5-large"
	| "nomic-embed-text";
export interface EmbeddingConfig {
	model: EmbeddingModel;
	dimensions: number;
	batchSize: number;
	normalizeVectors: boolean;
}
export declare const DEFAULT_EMBEDDING_CONFIG: EmbeddingConfig;
export type RerankerModel =
	| "cross-encoder/ms-marco-MiniLM-L-12-v2"
	| "BAAI/bge-reranker-v2-m3"
	| "cohere-rerank-v3";
export interface RerankerConfig {
	model: RerankerModel;
	topK: number;
	minScore: number;
	batchSize: number;
}
export declare const DEFAULT_RERANKER_CONFIG: RerankerConfig;
export declare class RAGError extends Error {
	code: RAGErrorCode;
	details?: Record<string, unknown> | undefined;
	constructor(
		message: string,
		code: RAGErrorCode,
		details?: Record<string, unknown> | undefined,
	);
}
export type RAGErrorCode =
	| "EMBEDDING_FAILED"
	| "SEARCH_FAILED"
	| "RERANK_FAILED"
	| "GENERATION_FAILED"
	| "DOCUMENT_NOT_FOUND"
	| "INVALID_QUERY"
	| "CONTEXT_TOO_LARGE"
	| "RATE_LIMITED";
//# sourceMappingURL=types.d.ts.map
