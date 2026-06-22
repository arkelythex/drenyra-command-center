import type { AIClassification, IAIProvider } from '@arkelythex/application';
export declare class GeminiAdapter implements IAIProvider {
    private genAI;
    constructor(apiKey: string);
    private hashPrompt;
    analyze(message: string, images?: string[], systemContext?: string): Promise<string>;
    classify(description: string, context?: string): Promise<AIClassification>;
    private callGeminiDirect;
}
//# sourceMappingURL=gemini.adapter.d.ts.map