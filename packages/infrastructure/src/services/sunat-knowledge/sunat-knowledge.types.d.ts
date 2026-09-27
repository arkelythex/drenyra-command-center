export type KnowledgeCategory = "igv" | "detraccion" | "sire" | "ruc" | "bancarizacion" | "pcge" | "uit" | "retencion" | "percepcion";
export interface KnowledgeChunk {
    id: string;
    source: string;
    documentType: string;
    title: string;
    content: string;
    category: KnowledgeCategory;
    section: string | null;
    effectiveDate: string | null;
    rank?: number;
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
export interface KnowledgeQuery {
    query: string;
    categories?: KnowledgeCategory[];
    limit?: number;
    minRank?: number;
}
export interface KnowledgeContext {
    formatted: string;
    chunks: KnowledgeChunk[];
    totalFound: number;
    sources: KnowledgeSourceReference[];
    corpusId: string | null;
    corpusKind: "documentary" | null;
}
export interface DocumentaryKnowledgeQuery extends KnowledgeQuery {
    corpusId: string;
}
//# sourceMappingURL=sunat-knowledge.types.d.ts.map