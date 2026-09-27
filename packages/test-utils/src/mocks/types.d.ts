export interface MockFactory<T> {
    success(data?: Partial<T>): T;
    failure(error: Error): T;
    timeout(ms?: number): Promise<T>;
}
export interface SunatResponse {
    ticket?: string;
    status: "accepted" | "rejected" | "pending" | "error";
    cdrCode?: string;
    cdrDescription?: string;
    errorMessage?: string;
    responseDate?: Date;
}
export interface PrometeoResponse {
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
    statusCode: number;
}
export interface LLMResponse {
    text: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    finishReason?: string;
}
export interface EmailResponse {
    messageId: string;
    status: "sent" | "failed" | "queued";
    error?: string;
}
//# sourceMappingURL=types.d.ts.map