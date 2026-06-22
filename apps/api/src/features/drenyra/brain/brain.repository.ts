/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */
import type {
	DrenyraBrainEvent,
	DrenyraBrainItem,
	DrenyraBrainThread,
	DrenyraBrainTurn,
	DrenyraFiscalScope,
} from "@arkelythex/domain/drenyra";
import { isSameFiscalScope } from "./brain.types";

export interface DrenyraBrainRepository {
	createThread(thread: DrenyraBrainThread): Promise<DrenyraBrainThread>;
	listThreads(fiscalScope: DrenyraFiscalScope): Promise<DrenyraBrainThread[]>;
	getThread(
		threadId: string,
		fiscalScope: DrenyraFiscalScope,
	): Promise<DrenyraBrainThread | null>;
	createTurn(turn: DrenyraBrainTurn): Promise<DrenyraBrainTurn>;
	appendItem(item: DrenyraBrainItem): Promise<DrenyraBrainItem>;
	listItems(
		threadId: string,
		fiscalScope: DrenyraFiscalScope,
	): Promise<DrenyraBrainItem[]>;
	appendEvent(event: DrenyraBrainEvent): Promise<DrenyraBrainEvent>;
	listEvents(threadId: string, fiscalScope: DrenyraFiscalScope): Promise<DrenyraBrainEvent[]>;
}

export function createInMemoryDrenyraBrainRepository(): DrenyraBrainRepository {
	const threads: DrenyraBrainThread[] = [];
	const turns: DrenyraBrainTurn[] = [];
	const items: DrenyraBrainItem[] = [];
	const events: DrenyraBrainEvent[] = [];

	return {
		async createThread(thread) {
			threads.push(thread);
			return thread;
		},
		async listThreads(fiscalScope) {
			return threads.filter((thread) =>
				isSameFiscalScope(thread.fiscalScope, fiscalScope),
			);
		},
		async getThread(threadId, fiscalScope) {
			return (
				threads.find(
					(thread) =>
						thread.id === threadId
						&& isSameFiscalScope(thread.fiscalScope, fiscalScope),
				) ?? null
			);
		},
		async createTurn(turn) {
			turns.push(turn);
			return turn;
		},
		async appendItem(item) {
			items.push(item);
			return item;
		},
		async listItems(threadId, fiscalScope) {
			return items.filter(
				(item) =>
					item.threadId === threadId
					&& isSameFiscalScope(item.fiscalScope, fiscalScope),
			);
		},
		async appendEvent(event) {
			events.push(event);
			return event;
		},
		async listEvents(threadId, fiscalScope) {
			return events.filter(
				(event) =>
					event.threadId === threadId
					&& isSameFiscalScope(event.fiscalScope, fiscalScope),
			).sort((a, b) => a.sequence - b.sequence);
		},
	};
}
