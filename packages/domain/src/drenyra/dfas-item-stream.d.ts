import { type DfasItemPayload, type DfasItemStreamEntry, type DfasItemType } from "./dfas-protocol-types";
import type { DrenyraFiscalScope } from "./types";
export interface CreateDfasItemStreamEntryInput {
    id: string;
    threadId: string;
    turnId?: string;
    sequence: number;
    itemType: DfasItemType;
    fiscalScope: DrenyraFiscalScope;
    payload: DfasItemPayload;
    traceId?: string;
    createdAt?: string;
}
export declare class DfasItemStreamValidationError extends Error {
    constructor(message: string);
}
export declare function createDfasItemStreamEntry(input: CreateDfasItemStreamEntryInput): DfasItemStreamEntry;
export declare function assertMonotonicSequence(entries: readonly DfasItemStreamEntry[]): void;
export declare function filterItemsByTurn(entries: readonly DfasItemStreamEntry[], turnId: string): DfasItemStreamEntry[];
export declare function maxItemSequence(entries: readonly DfasItemStreamEntry[]): number;
//# sourceMappingURL=dfas-item-stream.d.ts.map