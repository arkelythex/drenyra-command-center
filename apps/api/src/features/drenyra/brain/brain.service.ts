/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */

import type { DrenyraBrainEvidenceBridge } from "@drenyra/application/drenyra";
import type {
	DrenyraBrainEvent,
	DrenyraBrainEventType,
	DrenyraBrainItem,
	DrenyraBrainSourceSurface,
	DrenyraBrainThread,
	DrenyraBrainTurn,
	DrenyraFiscalScope,
} from "@drenyra/domain/drenyra";
import type { DrenyraBrainRepository } from "./brain.repository";
import type {
	CreateDrenyraBrainThreadInput,
	ListDrenyraBrainItemsInput,
	ListDrenyraBrainThreadsInput,
	StartDrenyraBrainTurnInput,
} from "./brain.types";

export interface DrenyraBrainServiceDeps {
	repository: DrenyraBrainRepository;
	now: () => string;
	id: (prefix: "thread" | "turn" | "item" | "event") => string;
	evidenceBridge?: DrenyraBrainEvidenceBridge;
}

export interface DrenyraBrainService {
	createThread(
		input: CreateDrenyraBrainThreadInput,
	): Promise<DrenyraBrainThread>;
	listThreads(
		input: ListDrenyraBrainThreadsInput,
	): Promise<DrenyraBrainThread[]>;
	startTurn(input: StartDrenyraBrainTurnInput): Promise<DrenyraBrainTurn>;
	listItems(input: ListDrenyraBrainItemsInput): Promise<DrenyraBrainItem[]>;
	listEvents(input: ListDrenyraBrainItemsInput): Promise<DrenyraBrainEvent[]>;
}

export function createDrenyraBrainService(
	deps: DrenyraBrainServiceDeps,
): DrenyraBrainService {
	const sequenceByThread = new Map<string, number>();

	async function appendAuditEvent(input: {
		threadId: string;
		turnId?: string;
		itemId?: string;
		fiscalScope: DrenyraFiscalScope;
		type: DrenyraBrainEventType;
		actorId: string;
		sourceSurface: DrenyraBrainSourceSurface;
		metadata?: Record<string, unknown>;
	}): Promise<DrenyraBrainEvent> {
		const nextSequence = (sequenceByThread.get(input.threadId) ?? 0) + 1;
		sequenceByThread.set(input.threadId, nextSequence);
		const event = await deps.repository.appendEvent({
			id: deps.id("event"),
			threadId: input.threadId,
			...(input.turnId !== undefined ? { turnId: input.turnId } : {}),
			...(input.itemId !== undefined ? { itemId: input.itemId } : {}),
			fiscalScope: input.fiscalScope,
			type: input.type,
			sequence: nextSequence,
			actorId: input.actorId,
			sourceSurface: input.sourceSurface,
			createdAt: deps.now(),
			metadata: input.metadata ?? {},
		});
		await deps.evidenceBridge?.appendEvent(event);
		return event;
	}

	return {
		async createThread(input) {
			const timestamp = deps.now();
			const thread: DrenyraBrainThread = {
				id: deps.id("thread"),
				title: input.title,
				fiscalScope: input.fiscalScope,
				status: "active",
				sourceSurface: input.sourceSurface,
				...(input.linkedCaseId !== undefined
					? { linkedCaseId: input.linkedCaseId }
					: {}),
				...(input.linkedMissionId !== undefined
					? { linkedMissionId: input.linkedMissionId }
					: {}),
				createdBy: input.createdBy,
				createdAt: timestamp,
				updatedAt: timestamp,
			};

			await deps.repository.createThread(thread);
			await appendAuditEvent({
				threadId: thread.id,
				fiscalScope: thread.fiscalScope,
				type: "thread_created",
				actorId: input.createdBy,
				sourceSurface: input.sourceSurface,
				metadata: {
					linkedCaseId: input.linkedCaseId,
					linkedMissionId: input.linkedMissionId,
				},
			});
			return thread;
		},

		async listThreads(input) {
			return deps.repository.listThreads(input.fiscalScope);
		},

		async startTurn(input) {
			const thread = await deps.repository.getThread(
				input.threadId,
				input.fiscalScope,
			);

			if (!thread) {
				throw new Error(
					`Thread '${input.threadId}' not found for provided fiscal scope`,
				);
			}

			const timestamp = deps.now();
			const turn: DrenyraBrainTurn = {
				id: deps.id("turn"),
				threadId: input.threadId,
				fiscalScope: input.fiscalScope,
				status: "running",
				prompt: input.prompt,
				sourceSurface: input.sourceSurface,
				createdBy: input.createdBy,
				createdAt: timestamp,
				updatedAt: timestamp,
			};

			await deps.repository.createTurn(turn);
			await appendAuditEvent({
				threadId: input.threadId,
				turnId: turn.id,
				fiscalScope: input.fiscalScope,
				type: "turn_started",
				actorId: input.createdBy,
				sourceSurface: input.sourceSurface,
			});

			const item: DrenyraBrainItem = {
				id: deps.id("item"),
				threadId: input.threadId,
				turnId: turn.id,
				fiscalScope: input.fiscalScope,
				type: "user_message",
				content: { text: input.prompt },
				actorId: input.createdBy,
				sourceSurface: input.sourceSurface,
				createdAt: timestamp,
			};

			await deps.repository.appendItem(item);
			await appendAuditEvent({
				threadId: input.threadId,
				turnId: turn.id,
				itemId: item.id,
				fiscalScope: input.fiscalScope,
				type: "item_appended",
				actorId: input.createdBy,
				sourceSurface: input.sourceSurface,
				metadata: { itemType: item.type },
			});
			return turn;
		},

		async listItems(input) {
			return deps.repository.listItems(input.threadId, input.fiscalScope);
		},

		async listEvents(input) {
			return deps.repository.listEvents(input.threadId, input.fiscalScope);
		},
	};
}
