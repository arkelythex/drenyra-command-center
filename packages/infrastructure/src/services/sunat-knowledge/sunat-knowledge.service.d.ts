import type { RAGSearchOptions, SearchScores } from "../../ai/rag/types";
import type { DocumentaryKnowledgeQuery, KnowledgeCategory, KnowledgeChunk, KnowledgeContext, KnowledgeQuery } from "./sunat-knowledge.types";
export declare class SunatKnowledgeService {
    retrieve(query: KnowledgeQuery): Promise<KnowledgeChunk[]>;
    buildContext(query: KnowledgeQuery): Promise<KnowledgeContext>;
    buildDocumentaryContext(query: DocumentaryKnowledgeQuery): Promise<KnowledgeContext>;
    getByCategory(category: KnowledgeCategory, limit?: number): Promise<KnowledgeChunk[]>;
    getStats(): Promise<Record<string, number>>;
    generateEmbedding(queryText: string): Promise<number[]>;
    vectorSearch(queryText: string, limit?: number): Promise<(KnowledgeChunk & {
        similarity: number;
    })[]>;
    hybridSearch(query: KnowledgeQuery, options?: RAGSearchOptions): Promise<(KnowledgeChunk & {
        scores: SearchScores;
    })[]>;
}
export declare const sunatKnowledgeService: SunatKnowledgeService;
//# sourceMappingURL=sunat-knowledge.service.d.ts.map