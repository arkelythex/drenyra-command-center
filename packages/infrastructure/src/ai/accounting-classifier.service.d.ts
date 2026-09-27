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
export declare function classifyExpense(input: ClassificationInput): Promise<ClassificationResult | null>;
export declare function suggestPurchaseEntry(invoice: {
    providerName: string;
    items: Array<{
        description: string;
        amount: number;
    }>;
    subtotal: number;
    igv: number;
    total: number;
}): Promise<{
    debit: Array<{
        accountCode: string;
        accountName: string;
        amount: number;
    }>;
    credit: Array<{
        accountCode: string;
        accountName: string;
        amount: number;
    }>;
} | null>;
export declare function quickClassify(description: string): {
    accountCode: string;
    accountName: string;
};
//# sourceMappingURL=accounting-classifier.service.d.ts.map