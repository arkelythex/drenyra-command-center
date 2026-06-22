/**
 * Elite RAG System Types
 *
 * Type definitions for the advanced Retrieval-Augmented Generation system
 * implementing hybrid search, semantic chunking, and cross-encoder reranking.
 *
 * @module infrastructure/ai/rag/types
 * @version 2.0.0 - Elite Edition
 * @since January 2026
 * Legal document categories for Peruvian tax law
 * @example
 * ```ts
 * const value: LegalDocumentType = {} as LegalDocumentType;
 * console.log(value);
 * ```
 */

export type LegalDocumentType =
	| "CODIGO_TRIBUTARIO"
	| "LEY_IMPUESTO_RENTA" // LIR
	| "LEY_IGV" // Ley del IGV
	| "RTF" // Resolución del Tribunal Fiscal
	| "DECRETO_SUPREMO"
	| "DECRETO_LEGISLATIVO"
	| "RESOLUCION_SUNAT"
	| "INFORME_SUNAT"
	| "PCGE" // Plan Contable General Empresarial
	| "NIC" // Normas Internacionales de Contabilidad
	| "NIIF"; // Normas Internacionales de Información Financiera

/**
 * Base document structure
 * @example
 * ```ts
 * const value: LegalDocument = {} as LegalDocument;
 * console.log(value);
 * ```
 */

export interface LegalDocument {
	id: string;
	type: LegalDocumentType;
	title: string;
	reference: string; // e.g., "D.Leg. 1520", "RTF 08472-3-2024"
	publishedDate: Date;
	effectiveDate?: Date;
	summary?: string;
	fullContent: string;
	sourceUrl?: string;
	metadata: DocumentMetadata;
}

/**
 * DocumentMetadata interface.
 *
 * @example
 * ```ts
 * const value: DocumentMetadata = {} as DocumentMetadata;
 * console.log(value);
 * ```
 */
export interface DocumentMetadata {
	version: number;
	lastUpdated: Date;
	supersededBy?: string;
	relatedDocuments?: string[];
	keywords: string[];
	applicableTo?: string[]; // e.g., ["MYPE", "Régimen General"]
}

// ============================================
// CHUNK TYPES
// ============================================

/**
 * Semantic chunk representing a meaningful unit of legal text
 * @example
 * ```ts
 * const value: SemanticChunk = {} as SemanticChunk;
 * console.log(value);
 * ```
 */

export interface SemanticChunk {
	id: string;
	documentId: string;
	documentType: LegalDocumentType;
	documentReference: string;

	// Content
	content: string;
	summary?: string;

	// Position
	chunkIndex: number;
	startPosition: number;
	endPosition: number;

	// Semantic metadata
	section?: string; // e.g., "Artículo 37", "Capítulo III"
	subsection?: string;
	articleNumber?: string;
	paragraphNumber?: string;

	// Vector embedding
	embedding?: number[];
	embeddingModel?: string;

	// Relationships
	parentChunkId?: string;
	childChunkIds?: string[];
	relatedChunkIds?: string[];

	// Search metadata
	keywords: string[];
	entities: ExtractedEntity[];

	createdAt: Date;
	updatedAt: Date;
}

/**
 * ExtractedEntity interface.
 *
 * @example
 * ```ts
 * const value: ExtractedEntity = {} as ExtractedEntity;
 * console.log(value);
 * ```
 */
export interface ExtractedEntity {
	type: "ARTICLE" | "AMOUNT" | "PERCENTAGE" | "DATE" | "RUC" | "CONCEPT";
	value: string;
	normalizedValue?: string;
	startPosition: number;
	endPosition: number;
}

// ============================================
// SEARCH TYPES
// ============================================

/**
 * Search query with optional filters
 * @example
 * ```ts
 * const value: RAGQuery = {} as RAGQuery;
 * console.log(value);
 * ```
 */

export interface RAGQuery {
	query: string;
	filters?: RAGFilters;
	options?: RAGSearchOptions;
}

/**
 * RAGFilters interface.
 *
 * @example
 * ```ts
 * const value: RAGFilters = {} as RAGFilters;
 * console.log(value);
 * ```
 */
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

/**
 * RAGSearchOptions interface.
 *
 * @example
 * ```ts
 * const value: RAGSearchOptions = {} as RAGSearchOptions;
 * console.log(value);
 * ```
 */
export interface RAGSearchOptions {
	/** Number of results to retrieve initially (before reranking) */
	topK: number;
	/** Number of results after reranking */
	finalK: number;
	/** Minimum similarity score (0-1) */
	minScore: number;
	/** Enable hybrid search (BM25 + Dense) */
	hybridSearch: boolean;
	/** Weight for dense search in hybrid mode (0-1) */
	denseWeight: number;
	/** Enable cross-encoder reranking */
	rerank: boolean;
	/** Include surrounding context */
	includeContext: boolean;
	/** Number of context chunks before/after */
	contextWindow: number;
}

/**
 * DEFAULT_SEARCH_OPTIONS const.
 *
 * @example
 * ```ts
 * console.log(DEFAULT_SEARCH_OPTIONS);
 * ```
 */
export const DEFAULT_SEARCH_OPTIONS: RAGSearchOptions = {
	topK: 20,
	finalK: 5,
	minScore: 0.5,
	hybridSearch: true,
	denseWeight: 0.7,
	rerank: true,
	includeContext: true,
	contextWindow: 1,
};

// ============================================
// SEARCH RESULTS
// ============================================

/**
 * Individual search result with scoring details
 * @example
 * ```ts
 * const value: RAGSearchResult = {} as RAGSearchResult;
 * console.log(value);
 * ```
 */

export interface RAGSearchResult {
	chunk: SemanticChunk;
	scores: SearchScores;
	citation: Citation;
	context?: ContextChunks;
}

/**
 * SearchScores interface.
 *
 * @example
 * ```ts
 * const value: SearchScores = {} as SearchScores;
 * console.log(value);
 * ```
 */
export interface SearchScores {
	/** BM25 lexical score */
	bm25Score: number;
	/** Dense vector similarity score */
	denseScore: number;
	/** Combined hybrid score */
	hybridScore: number;
	/** Cross-encoder reranking score */
	rerankScore?: number;
	/** Final score after all processing */
	finalScore: number;
}

/**
 * Citation interface.
 *
 * @example
 * ```ts
 * const value: Citation = {} as Citation;
 * console.log(value);
 * ```
 */
export interface Citation {
	/** Formatted citation string */
	text: string;
	/** Document reference */
	reference: string;
	/** Specific article/section */
	section?: string;
	/** Unique chunk ID for traceability */
	chunkId: string;
	/** Direct link to source if available */
	sourceUrl?: string;
}

/**
 * ContextChunks interface.
 *
 * @example
 * ```ts
 * const value: ContextChunks = {} as ContextChunks;
 * console.log(value);
 * ```
 */
export interface ContextChunks {
	before: SemanticChunk[];
	after: SemanticChunk[];
}

/**
 * Complete search response
 * @example
 * ```ts
 * const value: RAGSearchResponse = {} as RAGSearchResponse;
 * console.log(value);
 * ```
 */

export interface RAGSearchResponse {
	query: RAGQuery;
	results: RAGSearchResult[];
	metadata: SearchMetadata;
}

/**
 * SearchMetadata interface.
 *
 * @example
 * ```ts
 * const value: SearchMetadata = {} as SearchMetadata;
 * console.log(value);
 * ```
 */
export interface SearchMetadata {
	totalFound: number;
	searchTimeMs: number;
	embeddingTimeMs: number;
	rerankTimeMs?: number;
	modelUsed: string;
	searchStrategy: "dense" | "bm25" | "hybrid";
}

// ============================================
// GENERATION TYPES
// ============================================

/**
 * Context prepared for LLM generation
 * @example
 * ```ts
 * const value: RAGContext = {} as RAGContext;
 * console.log(value);
 * ```
 */

export interface RAGContext {
	/** Formatted context string for LLM */
	formattedContext: string;
	/** Source chunks used */
	sourceChunks: RAGSearchResult[];
	/** Total tokens in context */
	tokenCount: number;
	/** Citations for response */
	citations: Citation[];
}

/**
 * RAG generation request
 * @example
 * ```ts
 * const value: RAGGenerationRequest = {} as RAGGenerationRequest;
 * console.log(value);
 * ```
 */

export interface RAGGenerationRequest {
	query: string;
	context: RAGContext;
	systemPrompt?: string;
	temperature?: number;
	maxTokens?: number;
}

/**
 * RAG generation response with citations
 * @example
 * ```ts
 * const value: RAGGenerationResponse = {} as RAGGenerationResponse;
 * console.log(value);
 * ```
 */

export interface RAGGenerationResponse {
	answer: string;
	citations: InlineCitation[];
	confidence: number;
	metadata: GenerationMetadata;
}

/**
 * InlineCitation interface.
 *
 * @example
 * ```ts
 * const value: InlineCitation = {} as InlineCitation;
 * console.log(value);
 * ```
 */
export interface InlineCitation {
	/** Position in answer text */
	startPosition: number;
	endPosition: number;
	/** The cited text */
	citedText: string;
	/** Reference to source */
	citation: Citation;
}

/**
 * GenerationMetadata interface.
 *
 * @example
 * ```ts
 * const value: GenerationMetadata = {} as GenerationMetadata;
 * console.log(value);
 * ```
 */
export interface GenerationMetadata {
	model: string;
	promptTokens: number;
	completionTokens: number;
	totalTokens: number;
	latencyMs: number;
	contextChunksUsed: number;
}

// ============================================
// CHUNKING CONFIGURATION
// ============================================

/**
 * Configuration for semantic chunking
 * @example
 * ```ts
 * const value: ChunkingConfig = {} as ChunkingConfig;
 * console.log(value);
 * ```
 */

export interface ChunkingConfig {
	/** Target chunk size in tokens */
	targetChunkSize: number;
	/** Maximum chunk size in tokens */
	maxChunkSize: number;
	/** Minimum chunk size in tokens */
	minChunkSize: number;
	/** Overlap between chunks in tokens */
	overlapSize: number;
	/** Split on semantic boundaries */
	semanticSplit: boolean;
	/** Preserve article boundaries */
	preserveArticles: boolean;
	/** Preserve paragraph boundaries */
	preserveParagraphs: boolean;
}

/**
 * DEFAULT_CHUNKING_CONFIG const.
 *
 * @example
 * ```ts
 * console.log(DEFAULT_CHUNKING_CONFIG);
 * ```
 */
export const DEFAULT_CHUNKING_CONFIG: ChunkingConfig = {
	targetChunkSize: 512,
	maxChunkSize: 1024,
	minChunkSize: 100,
	overlapSize: 50,
	semanticSplit: true,
	preserveArticles: true,
	preserveParagraphs: true,
};

// ============================================
// EMBEDDING TYPES
// ============================================

/**
 * EmbeddingModel type.
 *
 * @example
 * ```ts
 * const value: EmbeddingModel = {} as EmbeddingModel;
 * console.log(value);
 * ```
 */
export type EmbeddingModel =
	| "text-embedding-3-large"
	| "text-embedding-3-small"
	| "bge-m3"
	| "multilingual-e5-large"
	| "nomic-embed-text";

/**
 * EmbeddingConfig interface.
 *
 * @example
 * ```ts
 * const value: EmbeddingConfig = {} as EmbeddingConfig;
 * console.log(value);
 * ```
 */
export interface EmbeddingConfig {
	model: EmbeddingModel;
	dimensions: number;
	batchSize: number;
	normalizeVectors: boolean;
}

/**
 * DEFAULT_EMBEDDING_CONFIG const.
 *
 * @example
 * ```ts
 * console.log(DEFAULT_EMBEDDING_CONFIG);
 * ```
 */
export const DEFAULT_EMBEDDING_CONFIG: EmbeddingConfig = {
	model: "text-embedding-3-large",
	dimensions: 3072,
	batchSize: 100,
	normalizeVectors: true,
};

// ============================================
// RERANKING TYPES
// ============================================

/**
 * RerankerModel type.
 *
 * @example
 * ```ts
 * const value: RerankerModel = {} as RerankerModel;
 * console.log(value);
 * ```
 */
export type RerankerModel =
	| "cross-encoder/ms-marco-MiniLM-L-12-v2"
	| "BAAI/bge-reranker-v2-m3"
	| "cohere-rerank-v3";

/**
 * RerankerConfig interface.
 *
 * @example
 * ```ts
 * const value: RerankerConfig = {} as RerankerConfig;
 * console.log(value);
 * ```
 */
export interface RerankerConfig {
	model: RerankerModel;
	topK: number;
	minScore: number;
	batchSize: number;
}

/**
 * DEFAULT_RERANKER_CONFIG const.
 *
 * @example
 * ```ts
 * console.log(DEFAULT_RERANKER_CONFIG);
 * ```
 */
export const DEFAULT_RERANKER_CONFIG: RerankerConfig = {
	model: "BAAI/bge-reranker-v2-m3",
	topK: 5,
	minScore: 0.3,
	batchSize: 50,
};

// ============================================
// ERROR TYPES
// ============================================

/**
 * RAGError class.
 *
 * @example
 * ```ts
 * const value = new RAGError();
 * console.log(value);
 * ```
 */
export class RAGError extends Error {
	constructor(
		message: string,
		public code: RAGErrorCode,
		public details?: Record<string, unknown>,
	) {
		super(message);
		this.name = "RAGError";
	}
}

/**
 * RAGErrorCode type.
 *
 * @example
 * ```ts
 * const value: RAGErrorCode = {} as RAGErrorCode;
 * console.log(value);
 * ```
 */
export type RAGErrorCode =
	| "EMBEDDING_FAILED"
	| "SEARCH_FAILED"
	| "RERANK_FAILED"
	| "GENERATION_FAILED"
	| "DOCUMENT_NOT_FOUND"
	| "INVALID_QUERY"
	| "CONTEXT_TOO_LARGE"
	| "RATE_LIMITED";
