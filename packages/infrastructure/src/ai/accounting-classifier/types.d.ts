import { z } from "zod";
export interface ClassificationInput {
    itemDescription: string;
    amount: number;
    businessType?: string;
    providerName?: string;
    category?: string;
}
export interface ClassificationResult {
    accountCode: string;
    accountName: string;
    category: "EXPENSE" | "ASSET" | "COST_OF_GOODS_SOLD" | "OTHER";
    confidence: number;
    reasoning: string;
    suggestedDebitAccount?: string;
    suggestedCreditAccount?: string;
}
export declare const ClassificationSchema: z.ZodObject<{
    accountCode: z.ZodString;
    accountName: z.ZodString;
    category: z.ZodEnum<{
        EXPENSE: "EXPENSE";
        OTHER: "OTHER";
        ASSET: "ASSET";
        COST_OF_GOODS_SOLD: "COST_OF_GOODS_SOLD";
    }>;
    confidence: z.ZodNumber;
    reasoning: z.ZodString;
    suggestedDebitAccount: z.ZodOptional<z.ZodString>;
    suggestedCreditAccount: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
//# sourceMappingURL=types.d.ts.map