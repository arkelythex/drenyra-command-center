import { DEFAULT_EMBEDDING_CONFIG } from "../../ai/rag/types";
export declare class EmbeddingService {
    private readonly config;
    constructor(config?: Partial<typeof DEFAULT_EMBEDDING_CONFIG>);
    private resolveModelId;
    generate(text: string): Promise<number[]>;
    generateBatch(texts: string[]): Promise<number[][]>;
    getConfig(): typeof DEFAULT_EMBEDDING_CONFIG;
}
export declare const embeddingService: EmbeddingService;
//# sourceMappingURL=embedding.service.d.ts.map