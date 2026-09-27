import type { Actor, FiscalScope, Timestamp } from "./types";
export type EvidenceCategory = "document" | "calculation" | "validation" | "approval" | "audit" | "external" | "receipt";
export interface EvidenceItem {
    id: string;
    category: EvidenceCategory;
    title: string;
    hash: string;
    timestamp: string;
    size?: number;
    mimeType?: string;
    ref?: string;
    tags?: string[];
}
export interface EvidenceRoot {
    id: string;
    rootHash: string;
    items: EvidenceItem[];
    sortedHashes: string[];
    computedAt: Timestamp;
    computedBy: Actor;
    scope: FiscalScope;
    version: string;
}
export declare const EVIDENCE_ROOT_VERSION = "1.0.0";
export declare function hashEvidenceContent(content: unknown): string;
export declare function computeEvidenceRootHash(items: EvidenceItem[]): {
    rootHash: string;
    sortedHashes: string[];
};
export declare function createEvidenceRoot(input: {
    items: EvidenceItem[];
    computedBy: Actor;
    scope: FiscalScope;
}): EvidenceRoot;
export declare function verifyEvidenceRoot(root: EvidenceRoot): {
    valid: boolean;
    errors: string[];
};
export declare function evidenceInRoot(item: EvidenceItem, root: EvidenceRoot): boolean;
export interface FeosReceipt {
    receiptId: string;
    action: string;
    timestamp: string;
    actor: Actor;
    scope: FiscalScope;
    evidenceRoot: EvidenceRoot;
    inputHash: string;
    outputHash: string;
    chainHash: string;
    previousChainHash?: string;
    version: string;
}
export declare const FEOS_RECEIPT_VERSION = "1.0.0";
export declare function createFeosReceipt(input: {
    receiptId: string;
    action: string;
    actor: Actor;
    scope: FiscalScope;
    evidenceItems: EvidenceItem[];
    actionInput: unknown;
    actionOutput: unknown;
    previousChainHash?: string;
}): FeosReceipt;
export declare function verifyFeosReceipt(receipt: FeosReceipt): {
    valid: boolean;
    errors: string[];
};
export interface EvidenceRootStore {
    store(root: EvidenceRoot): Promise<void>;
    get(id: string): Promise<EvidenceRoot | null>;
    storeReceipt(receipt: FeosReceipt): Promise<void>;
    getReceipt(id: string): Promise<FeosReceipt | null>;
    listForScope(scope: FiscalScope): Promise<EvidenceRoot[]>;
    verifyStoredReceipt(receiptId: string): Promise<{
        valid: boolean;
        errors: string[];
    }>;
}
//# sourceMappingURL=evidence-root.d.ts.map