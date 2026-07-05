import { type ClassificationInput, type ClassificationResult } from "./types";
export declare function classifyExpense(
	input: ClassificationInput,
): Promise<ClassificationResult | null>;
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
//# sourceMappingURL=service.d.ts.map
