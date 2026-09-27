import { type OCRResult } from "./schemas/invoice";
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
export declare function extractInvoiceData(options: OCROptions): Promise<OCRResponse>;
export declare function batchExtractInvoices(documents: OCROptions[]): Promise<OCRResponse[]>;
export declare function extractFromFile(file: File, organizationId?: number): Promise<OCRResponse>;
//# sourceMappingURL=ocr.service.d.ts.map