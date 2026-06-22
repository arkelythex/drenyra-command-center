export interface RerankerConfig {
    model: string;
    topK: number;
    minScore: number;
}
export declare const DEFAULT_RERANKER_CONFIG: RerankerConfig;
export interface RerankerResult {
    chunkId: string;
    originalIndex: number;
    score: number;
}
export declare class RerankerService {
    private readonly config;
    constructor(config?: Partial<RerankerConfig>);
    rerank(query: string, chunks: {
        id: string;
        content: string;
    }[]): Promise<RerankerResult[]>;
    private scoreRelevance;
    getConfig(): RerankerConfig;
}
export declare const rerankerService: RerankerService;
//# sourceMappingURL=reranker.service.d.ts.map