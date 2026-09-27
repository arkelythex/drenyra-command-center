export interface PcgeAccount {
    code: string;
    name: string;
    type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE" | "COST";
    category: string;
    keywords: string[];
}
export declare const PCGE_CATALOG: PcgeAccount[];
export declare function findBestAccount(description: string, vendorName?: string): {
    account: PcgeAccount;
    confidence: number;
};
//# sourceMappingURL=pcge-catalog.d.ts.map