import { db } from "@drenyra/persistence/client";
import { sql } from "drizzle-orm";
import { embeddingService } from "../embedding/embedding.service";
import { rerankerService } from "../reranker/reranker.service";

function buildKnowledgeSources(chunks, corpusId) {
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
const DEFAULT_HYBRID_OPTIONS = {
	topK: 20,
	finalK: 5,
	minScore: 0.5,
	hybridSearch: true,
	denseWeight: 0.7,
	rerank: true,
	includeContext: true,
	contextWindow: 1,
};
export class SunatKnowledgeService {
	async retrieve(query) {
		const { query: text, categories, limit = 5, minRank = 0.01 } = query;
		const categoryFilter =
			categories && categories.length > 0
				? sql`AND category = ANY(ARRAY[${sql.raw(categories.map((c) => `'${c}'`).join(","))}]::text[])`
				: sql``;
		const rows = await db.execute(sql`
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
			category: r.category,
			section: r.section,
			effectiveDate: r.effective_date,
			rank: r.rank,
		}));
	}
	async buildContext(query) {
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
	async buildDocumentaryContext(query) {
		const context = await this.buildContext(query);
		return {
			...context,
			sources: buildKnowledgeSources(context.chunks, query.corpusId),
			corpusId: query.corpusId,
			corpusKind: "documentary",
		};
	}
	async getByCategory(category, limit = 10) {
		return this.retrieve({ query: category, categories: [category], limit });
	}
	async getStats() {
		const rows = await db.execute(sql`
      SELECT category, COUNT(*)::text AS count
      FROM sunat_knowledge_chunks
      GROUP BY category
      ORDER BY count DESC
    `);
		return Object.fromEntries(
			Array.from(rows).map((r) => [r.category, Number(r.count)]),
		);
	}
	async generateEmbedding(queryText) {
		return embeddingService.generate(queryText);
	}
	async vectorSearch(queryText, limit = 5) {
		const embedding = await this.generateEmbedding(queryText);
		const embeddingStr = `[${embedding.join(",")}]`;
		const rows = await db.execute(sql`
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
			category: r.category,
			section: r.section,
			effectiveDate: r.effective_date,
			similarity: r.similarity,
		}));
	}
	async hybridSearch(query, options = DEFAULT_HYBRID_OPTIONS) {
		const { denseWeight } = options;
		const bm25Weight = 1 - denseWeight;
		const limit = options.topK;
		const [bm25Results, denseResults] = await Promise.all([
			this.retrieve({ ...query, limit }),
			this.vectorSearch(query.query, limit),
		]);
		const bm25Max = Math.max(...bm25Results.map((r) => r.rank ?? 0), 0.01);
		const bm25Normalized = new Map(
			bm25Results.map((r) => [
				r.id,
				{ chunk: r, score: (r.rank ?? 0) / bm25Max },
			]),
		);
		const denseMax = Math.max(...denseResults.map((r) => r.similarity), 0.01);
		const denseNormalized = new Map(
			denseResults.map((r) => [
				r.id,
				{ chunk: r, score: r.similarity / denseMax },
			]),
		);
		const combinedResults = new Map();
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
		const sortedResults = Array.from(combinedResults.values())
			.filter((r) => r.scores.hybridScore >= options.minScore)
			.sort((a, b) => b.scores.hybridScore - a.scores.hybridScore)
			.slice(0, limit);
		if (options.rerank && sortedResults.length > 0) {
			const rerankResults = await rerankerService.rerank(
				query.query,
				sortedResults.map((r) => ({ id: r.id, content: r.content })),
			);
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
export const sunatKnowledgeService = new SunatKnowledgeService();
//# sourceMappingURL=sunat-knowledge.service.js.map
