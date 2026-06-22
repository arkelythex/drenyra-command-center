export interface AIClassification {
    accountCode: string;
    accountName: string;
    subAccountCode?: string;
    taxType: "GRAVADO" | "EXONERADO" | "INAFECTO";
    confidence: number;
    reasoning: string;
}
export interface IAIProvider {
    classify(description: string, context?: string): Promise<AIClassification>;
    analyze(message: string, images?: string[], context?: string): Promise<string>;
    embedText?(text: string): Promise<number[]>;
}
//# sourceMappingURL=ai-provider.port.d.ts.map