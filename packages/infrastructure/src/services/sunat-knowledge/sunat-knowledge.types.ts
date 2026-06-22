/**
 * SUNAT Knowledge Base — Domain Types
 *
 * Bridges the elite RAG types (rag/types.ts) with the concrete PostgreSQL FTS implementation.
 * Uses tsvector + plainto_tsquery instead of pgvector — same BM25 scoring principle,
 * zero external dependencies, fully auditable.
 * @example
 * ```ts
 * const value: KnowledgeCategory = {} as KnowledgeCategory;
 * console.log(value);
 * ```
 */

export type KnowledgeCategory =
	| "igv"
	| "detraccion"
	| "sire"
	| "ruc"
	| "bancarizacion"
	| "pcge"
	| "uit"
	| "retencion"
	| "percepcion";

/**
 * KnowledgeChunk interface.
 *
 * @example
 * ```ts
 * const value: KnowledgeChunk = {} as KnowledgeChunk;
 * console.log(value);
 * ```
 */
export interface KnowledgeChunk {
	id: string;
	source: string;
	documentType: string;
	title: string;
	content: string;
	category: KnowledgeCategory;
	section: string | null;
	effectiveDate: string | null; // ISO date string
	rank?: number; // ts_rank score from FTS query
}

export interface KnowledgeSourceReference {
	chunkId: string;
	corpusId: string;
	corpusKind: "documentary";
	source: string;
	title: string;
	section: string | null;
	effectiveDate: string | null;
}

/**
 * KnowledgeQuery interface.
 *
 * @example
 * ```ts
 * const value: KnowledgeQuery = {} as KnowledgeQuery;
 * console.log(value);
 * ```
 */
export interface KnowledgeQuery {
	query: string;
	categories?: KnowledgeCategory[];
	limit?: number;
	minRank?: number;
}

/**
 * KnowledgeContext interface.
 *
 * @example
 * ```ts
 * const value: KnowledgeContext = {} as KnowledgeContext;
 * console.log(value);
 * ```
 */
export interface KnowledgeContext {
	/** Formatted context string for LLM injection */
	formatted: string;
	/** Raw chunks retrieved */
	chunks: KnowledgeChunk[];
	/** Total chunks found */
	totalFound: number;
	/** Traceable documentary sources used for evaluation/audit */
	sources: KnowledgeSourceReference[];
	/** Corpus enforcement metadata */
	corpusId: string | null;
	corpusKind: "documentary" | null;
}

export interface DocumentaryKnowledgeQuery extends KnowledgeQuery {
	corpusId: string;
}
