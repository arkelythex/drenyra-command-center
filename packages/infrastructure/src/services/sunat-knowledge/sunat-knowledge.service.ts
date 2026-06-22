/**
 * SUNAT Knowledge Service — PostgreSQL FTS + Vector Search Implementation
 *
 * Inspired by ZeroClaw's SQLite hybrid memory (FTS5 + cosine similarity).
 * Here: PostgreSQL tsvector + plainto_tsquery with Spanish dictionary.
 *
 * Architecture decision: FTS + pgvector for SUNAT norms because:
 * 1. Legal text is lexically precise — "detracciones" doesn't benefit from semantic fuzzy search
 * 2. Zero external vector DB dependency — auditors can verify every query
 * 3. BM25-equivalent ranking via ts_rank — well-understood scoring
 * 4. Can extend with pgvector in Phase 2 without schema changes
 * 5. Hybrid search combines BM25 + Dense for best of both worlds
 */

import { sql } from "drizzle-orm";
import type { RAGSearchOptions, SearchScores } from "../../ai/rag/types";
import { db } from "@arkelythex/persistence/client";
import { embeddingService } from "../embedding/embedding.service";
import { rerankerService } from "../reranker/reranker.service";
import type {
	DocumentaryKnowledgeQuery,
	KnowledgeCategory,
	KnowledgeChunk,
	KnowledgeContext,
	KnowledgeQuery,
	KnowledgeSourceReference,
} from "./sunat-knowledge.types";

function buildKnowledgeSources(
	chunks: readonly KnowledgeChunk[],
	corpusId: string,
): KnowledgeSourceReference[] {
	return chunks.map((chunk) => ({
		chunkId: chunk.id,
		corpusId,
		corpusKind: "documentary",
		source: chunk.source,
		title: chunk.title,
		section: chunk.section,
		effectiveDate: chunk.effectiveDate,
	}));
}

/**
 * Default hybrid search options.
 * Weights: 0.3 BM25 + 0.7 Dense as per design doc.
 */
const DEFAULT_HYBRID_OPTIONS: RAGSearchOptions = {
	topK: 20,
	finalK: 5,
	minScore: 0.5,
	hybridSearch: true,
	denseWeight: 0.7,
	rerank: true,
	includeContext: true,
	contextWindow: 1,
};

/**
 * SunatKnowledgeService class.
 *
 * @example
 * ```ts
 * const value = new SunatKnowledgeService();
 * console.log(value);
 * ```
 */
export class SunatKnowledgeService {
	/**
	 * Retrieve SUNAT norm chunks relevant to a query using PostgreSQL FTS.
	 * Uses plainto_tsquery (handles natural language) over phraseto_tsquery.
	 *
	 * @param query - Natural language query, e.g. "tasa detracción servicios"
	 * @param options - Optional filters and limits
	 */
	async retrieve(query: KnowledgeQuery): Promise<KnowledgeChunk[]> {
		const { query: text, categories, limit = 5, minRank = 0.01 } = query;

		const categoryFilter =
			categories && categories.length > 0
				? sql`AND category = ANY(ARRAY[${sql.raw(categories.map((c) => `'${c}'`).join(","))}]::text[])`
				: sql``;

		const rows = await db.execute<{
			id: string;
			source: string;
			document_type: string;
			title: string;
			content: string;
			category: string;
			section: string | null;
			effective_date: string | null;
			rank: number;
		}>(sql`
      SELECT
        id,
        source,
        document_type,
        title,
        content,
        category,
        section,
        effective_date::text,
        ts_rank(search_vector, plainto_tsquery('spanish', ${text})) AS rank
      FROM sunat_knowledge_chunks
      WHERE
        search_vector @@ plainto_tsquery('spanish', ${text})
        ${categoryFilter}
        AND ts_rank(search_vector, plainto_tsquery('spanish', ${text})) >= ${minRank}
      ORDER BY rank DESC
      LIMIT ${limit}
    `);

		return Array.from(rows).map((r) => ({
			id: r.id,
			source: r.source,
			documentType: r.document_type,
			title: r.title,
			content: r.content,
			category: r.category as KnowledgeCategory,
			section: r.section,
			effectiveDate: r.effective_date,
			rank: r.rank,
		}));
	}

	/**
	 * Build a formatted context string for LLM injection.
	 * Format mirrors the existing `buildSunatRagContext` pattern in rule-pack.ts
	 * but backed by the DB instead of hardcoded constants.
	 */
	async buildContext(query: KnowledgeQuery): Promise<KnowledgeContext> {
		const chunks = await this.retrieve(query);

		if (chunks.length === 0) {
			return {
				formatted: "",
				chunks: [],
				totalFound: 0,
				sources: [],
				corpusId: null,
				corpusKind: null,
			};
		}

		const sections = chunks.map((chunk, i) => {
			const date = chunk.effectiveDate
				? ` (vigente desde ${chunk.effectiveDate})`
				: "";
			const section = chunk.section ? ` — ${chunk.section}` : "";
			return [
				`[${i + 1}] ${chunk.source}${section}${date}`,
				`Tema: ${chunk.title}`,
				chunk.content,
			].join("\n");
		});

		const formatted = [
			"=== BASE NORMATIVA SUNAT (recuperada por relevancia) ===",
			sections.join("\n\n"),
			"=== FIN BASE NORMATIVA ===",
		].join("\n\n");

		return {
			formatted,
			chunks,
			totalFound: chunks.length,
			sources: [],
			corpusId: null,
			corpusKind: null,
		};
	}

	async buildDocumentaryContext(
		query: DocumentaryKnowledgeQuery,
	): Promise<KnowledgeContext> {
		const context = await this.buildContext(query);
		return {
			...context,
			sources: buildKnowledgeSources(context.chunks, query.corpusId),
			corpusId: query.corpusId,
			corpusKind: "documentary",
		};
	}

	/**
	 * Retrieve chunks by category (for deterministic rule-fetching).
	 */
	async getByCategory(
		category: KnowledgeCategory,
		limit = 10,
	): Promise<KnowledgeChunk[]> {
		return this.retrieve({ query: category, categories: [category], limit });
	}

	/**
	 * Count chunks per category — useful for health checks.
	 */
	async getStats(): Promise<Record<string, number>> {
		const rows = await db.execute<{ category: string; count: string }>(sql`
      SELECT category, COUNT(*)::text AS count
      FROM sunat_knowledge_chunks
      GROUP BY category
      ORDER BY count DESC
    `);

		return Object.fromEntries(
			Array.from(rows).map((r) => [r.category, Number(r.count)]),
		);
	}

	/**
	 * Generate embedding for a query string.
	 * Used for vector similarity search.
	 *
	 * @param queryText - The query text to embed
	 * @returns Promise resolving to embedding vector array
	 */
	async generateEmbedding(queryText: string): Promise<number[]> {
		return embeddingService.generate(queryText);
	}

	/**
	 * Perform vector similarity search using cosine distance.
	 * Searches the embedding column for similar chunks.
	 *
	 * @param queryText - The query text to search for
	 * @param limit - Maximum number of results
	 * @returns Promise resolving to array of chunks with similarity scores
	 */
	async vectorSearch(
		queryText: string,
		limit = 5,
	): Promise<(KnowledgeChunk & { similarity: number })[]> {
		// Generate embedding for the query
		const embedding = await this.generateEmbedding(queryText);

		// Convert embedding to vector literal format for PostgreSQL
		const embeddingStr = `[${embedding.join(",")}]`;

		const rows = await db.execute<{
			id: string;
			source: string;
			document_type: string;
			title: string;
			content: string;
			category: string;
			section: string | null;
			effective_date: string | null;
			similarity: number;
		}>(sql`
      SELECT
        id,
        source,
        document_type,
        title,
        content,
        category,
        section,
        effective_date::text,
        1 - (embedding <=> ${embeddingStr}::vector) AS similarity
      FROM sunat_knowledge_chunks
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${embeddingStr}::vector
      LIMIT ${limit}
    `);

		return Array.from(rows).map((r) => ({
			id: r.id,
			source: r.source,
			documentType: r.document_type,
			title: r.title,
			content: r.content,
			category: r.category as KnowledgeCategory,
			section: r.section,
			effectiveDate: r.effective_date,
			similarity: r.similarity,
		}));
	}

	/**
	 * Perform hybrid search combining BM25 (FTS) + Dense (vector) with configurable weights.
	 * This is the core retrieval method for the RAG pipeline.
	 *
	 * @param query - The search query
	 * @param options - Optional search options (defaults to 0.3 BM25 + 0.7 Dense)
	 * @returns Promise resolving to array of chunks with combined scores
	 */
	async hybridSearch(
		query: KnowledgeQuery,
		options: RAGSearchOptions = DEFAULT_HYBRID_OPTIONS,
	): Promise<(KnowledgeChunk & { scores: SearchScores })[]> {
		const { denseWeight } = options;
		const bm25Weight = 1 - denseWeight;
		const limit = options.topK;

		// Execute both searches in parallel
		const [bm25Results, denseResults] = await Promise.all([
			this.retrieve({ ...query, limit }),
			this.vectorSearch(query.query, limit),
		]);

		// Normalize BM25 scores (ts_rank is 0-1, already normalized)
		const bm25Max = Math.max(...bm25Results.map((r) => r.rank ?? 0), 0.01);
		const bm25Normalized = new Map(
			bm25Results.map((r) => [
				r.id,
				{ chunk: r, score: (r.rank ?? 0) / bm25Max },
			]),
		);

		// Normalize dense scores (similarity is 0-1)
		const denseMax = Math.max(...denseResults.map((r) => r.similarity), 0.01);
		const denseNormalized = new Map(
			denseResults.map((r) => [
				r.id,
				{ chunk: r, score: r.similarity / denseMax },
			]),
		);

		// Combine scores using weighted average
		const combinedResults = new Map<
			string,
			KnowledgeChunk & { scores: SearchScores }
		>();

		// Process BM25 results
		for (const [id, data] of bm25Normalized) {
			const denseData = denseNormalized.get(id);
			const denseScore = denseData ? denseData.score : 0;

			const hybridScore = bm25Weight * data.score + denseWeight * denseScore;

			combinedResults.set(id, {
				...data.chunk,
				scores: {
					bm25Score: data.score,
					denseScore,
					hybridScore,
					finalScore: hybridScore,
				},
			});
		}

		// Add any dense-only results
		for (const [id, data] of denseNormalized) {
			if (!combinedResults.has(id)) {
				const bm25Data = bm25Normalized.get(id);
				const bm25Score = bm25Data ? bm25Data.score : 0;

				const hybridScore = bm25Weight * bm25Score + denseWeight * data.score;

				combinedResults.set(id, {
					...data.chunk,
					scores: {
						bm25Score,
						denseScore: data.score,
						hybridScore,
						finalScore: hybridScore,
					},
				});
			}
		}

		// Sort by hybrid score and apply minScore filter
		const sortedResults = Array.from(combinedResults.values())
			.filter((r) => r.scores.hybridScore >= options.minScore)
			.sort((a, b) => b.scores.hybridScore - a.scores.hybridScore)
			.slice(0, limit);

		// Apply reranking if enabled
		if (options.rerank && sortedResults.length > 0) {
			const rerankResults = await rerankerService.rerank(
				query.query,
				sortedResults.map((r) => ({ id: r.id, content: r.content })),
			);

			// Reorder based on reranking scores
			const rerankedMap = new Map(
				rerankResults.map((r, i) => [r.chunkId, { ...r, newIndex: i }]),
			);

			return sortedResults.map((r) => {
				const rerankData = rerankedMap.get(r.id);
				if (rerankData) {
					return {
						...r,
						scores: {
							...r.scores,
							rerankScore: rerankData.score,
							finalScore: rerankData.score,
						},
					};
				}
				return r;
			});
		}

		return sortedResults;
	}
}

/**
 * sunatKnowledgeService const.
 *
 * @example
 * ```ts
 * console.log(sunatKnowledgeService);
 * ```
 */
export const sunatKnowledgeService = new SunatKnowledgeService();
