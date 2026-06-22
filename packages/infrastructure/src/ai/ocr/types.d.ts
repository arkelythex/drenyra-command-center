import { type OCRResult } from "../schemas/invoice";
export interface OCROptions {
    imageUrl?: string;
    pdfUrl?: string;
    base64Data?: string;
    mimeType?: string;
    organizationId?: number;
}
export interface OCRResponse {
    success: boolean;
    data?: OCRResult;
    error?: string;
    cost?: number;
    duration?: number;
    tokensUsed?: {
        input: number;
        output: number;
    };
}
//# sourceMappingURL=types.d.ts.map