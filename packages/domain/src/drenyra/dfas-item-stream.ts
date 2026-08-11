/**
 * DFAS item stream factory and validators — fail-closed append semantics.
 */

import {
	DFAS_ITEM_TYPE,
	DFAS_PROTOCOL_VERSION,
	type DfasItemPayload,
	type DfasItemStreamEntry,
	type DfasItemType,
	isValidDfasFiscalScope,
} from "./dfas-protocol-types";
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

export class DfasItemStreamValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "DfasItemStreamValidationError";
	}
}

/**
 * Creates a validated item stream entry. Throws on invalid scope or sequence.
 */
export function createDfasItemStreamEntry(
	input: CreateDfasItemStreamEntryInput,
): DfasItemStreamEntry {
	if (!input.id.trim()) {
		throw new DfasItemStreamValidationError("item id is required");
	}
	if (!input.threadId.trim()) {
		throw new DfasItemStreamValidationError("threadId is required");
	}
	if (!Number.isInteger(input.sequence) || input.sequence < 0) {
		throw new DfasItemStreamValidationError(
			"sequence must be a non-negative integer",
		);
	}
	if (!isValidDfasFiscalScope(input.fiscalScope)) {
		throw new DfasItemStreamValidationError("invalid fiscal scope");
	}
	if (!Object.values(DFAS_ITEM_TYPE).includes(input.itemType)) {
		throw new DfasItemStreamValidationError(
			`unknown item type: ${input.itemType}`,
		);
	}

	return {
		id: input.id,
		threadId: input.threadId,
		...(input.turnId !== undefined ? { turnId: input.turnId } : {}),
		sequence: input.sequence,
		itemType: input.itemType,
		fiscalScope: input.fiscalScope,
		payload: input.payload,
		...(input.traceId !== undefined ? { traceId: input.traceId } : {}),
		protocolVersion: DFAS_PROTOCOL_VERSION,
		createdAt: input.createdAt ?? new Date().toISOString(),
	};
}

/** Ensures monotonic sequence ordering within a thread stream. */
export function assertMonotonicSequence(
	entries: readonly DfasItemStreamEntry[],
): void {
	for (let i = 1; i < entries.length; i++) {
		const prev = entries[i - 1];
		const curr = entries[i];
		if (!prev || !curr) continue;
		if (curr.sequence <= prev.sequence) {
			throw new DfasItemStreamValidationError(
				`non-monotonic sequence at index ${i}: ${prev.sequence} -> ${curr.sequence}`,
			);
		}
	}
}

/** Filters stream entries to a single turn. */
export function filterItemsByTurn(
	entries: readonly DfasItemStreamEntry[],
	turnId: string,
): DfasItemStreamEntry[] {
	return entries.filter((e) => e.turnId === turnId);
}

/** Returns the highest sequence number in a thread stream, or -1 if empty. */
export function maxItemSequence(
	entries: readonly DfasItemStreamEntry[],
): number {
	if (entries.length === 0) return -1;
	return Math.max(...entries.map((e) => e.sequence));
}
