import type { OSEConfig, OSEResponse, SendInvoiceData } from "./types";
export declare class OSEService {
    private static config;
    private static readonly MAX_RETRIES;
    private static readonly RETRY_DELAY;
    static sendInvoice(data: SendInvoiceData): Promise<OSEResponse>;
    static checkStatus(): Promise<{
        online: boolean;
        provider: string;
        message: string;
    }>;
    static verifyWebhookSignature(rawPayload: string, signatureHeader?: string): boolean;
    static parseCDR(cdrBase64: string): {
        status: string;
        message: string;
        code: string;
    };
    static updateConfig(newConfig: Partial<OSEConfig>): void;
    static getConfig(): OSEConfig;
    private static getEffectiveConfig;
    private static parseBoolean;
    private static parseProvider;
    private static createConfigErrorResponse;
    private static executeWithRetry;
    private static delay;
}
//# sourceMappingURL=ose.service.d.ts.map