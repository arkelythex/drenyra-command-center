import { DFAS_ITEM_TYPE, DFAS_PROTOCOL_VERSION, isValidDfasFiscalScope, } from "./dfas-protocol-types";
export class DfasItemStreamValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "DfasItemStreamValidationError";
    }
}
export function createDfasItemStreamEntry(input) {
    if (!input.id.trim()) {
        throw new DfasItemStreamValidationError("item id is required");
    }
    if (!input.threadId.trim()) {
        throw new DfasItemStreamValidationError("threadId is required");
    }
    if (!Number.isInteger(input.sequence) || input.sequence < 0) {
        throw new DfasItemStreamValidationError("sequence must be a non-negative integer");
    }
    if (!isValidDfasFiscalScope(input.fiscalScope)) {
        throw new DfasItemStreamValidationError("invalid fiscal scope");
    }
    if (!Object.values(DFAS_ITEM_TYPE).includes(input.itemType)) {
        throw new DfasItemStreamValidationError(`unknown item type: ${input.itemType}`);
    }
    return {
        id: input.id,
        threadId: input.threadId,
        turnId: input.turnId,
        sequence: input.sequence,
        itemType: input.itemType,
        fiscalScope: input.fiscalScope,
        payload: input.payload,
        traceId: input.traceId,
        protocolVersion: DFAS_PROTOCOL_VERSION,
        createdAt: input.createdAt ?? new Date().toISOString(),
    };
}
export function assertMonotonicSequence(entries) {
    for (let i = 1; i < entries.length; i++) {
        const prev = entries[i - 1];
        const curr = entries[i];
        if (!prev || !curr)
            continue;
        if (curr.sequence <= prev.sequence) {
            throw new DfasItemStreamValidationError(`non-monotonic sequence at index ${i}: ${prev.sequence} -> ${curr.sequence}`);
        }
    }
}
export function filterItemsByTurn(entries, turnId) {
    return entries.filter((e) => e.turnId === turnId);
}
export function maxItemSequence(entries) {
    if (entries.length === 0)
        return -1;
    return Math.max(...entries.map((e) => e.sequence));
}
//# sourceMappingURL=dfas-item-stream.js.map