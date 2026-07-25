/**
 * consumeOnce — Transactional consumer wrapper (W2-05).
 *
 * Guarantees exactly-once processing for any message consumer:
 * - Calculates deterministic payload hash
 * - Acquires inbox slot (INSERT ON CONFLICT + state routing)
 * - Executes handler within the same transaction
 * - Marks COMPLETED with ownership fencing token
 * - Returns typed acquisition decision for broker ACK/NACK
 *
 * == API Surface ==
 *
 * consume() — public safe API
 *   Manages the full transaction lifecycle: begin → acquire → handle → markCompleted → commit.
 *   If any step fails, rolls back the entire unit of work. Callers pass a `txFactory`
 *   (framework adapters implement this against their DB pool).
 *
 * consumeWithTx() — internal primitive
 *   Works within an externally-managed transaction. Use for composition when the caller
 *   needs to perform additional operations atomically alongside the inbox update.
 *
 * Transport-agnostic core. Broker adapters (NATS, BullMQ, webhooks)
 * use the result to decide ACK/NACK/dead-letter.
 */

import { hashPayload } from "../../shared/idempotency/hash-payload";
import type {
	AcquireInput,
	InboxRepository,
	TxClient,
} from "./repository-types";
import type { ConsumeInput, InboxAcquisition } from "./types";

// ─── Default processing timeout ──────────────────────────────────────────────

const DEFAULT_PROCESSING_TIMEOUT_MS = 30_000;

// ─── Transaction factory interface ───────────────────────────────────────────

/**
 * Framework-agnostic transaction factory.
 *
 * Adapters (PostgreSQL, Drizzle, etc.) implement this to provide
 * a transaction-scoped client, commit, and rollback without leaking
 * framework details into the application layer.
 */
export interface TxFactory {
	begin(): Promise<{
		tx: TxClient;
		commit(): Promise<void>;
		rollback(): Promise<void>;
	}>;
}

// ─── Consume result types ───────────────────────────────────────────────────

export type ConsumeResult<TBody> =
	| { kind: "consumed"; inboxId: string; result: TBody; attemptCount: number }
	| { kind: "already-completed"; acquisition: InboxAcquisition }
	| { kind: "action-required"; acquisition: InboxAcquisition };

// ─── Error types ─────────────────────────────────────────────────────────────

export class ConsumeTransactionError extends Error {
	constructor(
		message: string,
		public readonly cause: unknown,
	) {
		super(message);
		this.name = "ConsumeTransactionError";
	}
}

// ─── ConsumeOnceWrapper ──────────────────────────────────────────────────────

export class ConsumeOnceWrapper {
	constructor(private readonly inboxRepo: InboxRepository) {}

	// ─── Public safe API ──────────────────────────────────────────────────

	/**
	 * consume() — Safe public API.
	 *
	 * Manages the FULL transaction lifecycle:
	 *   1. Begins a transaction via txFactory
	 *   2. Acquires the inbox slot within the transaction
	 *   3. On ACQUIRED: executes the handler, then markCompleted
	 *   4. Commits the transaction
	 *
	 * On ANY failure (handler error, markCompleted failure, commit failure):
	 *   - Rolls back the transaction
	 *   - No domain effect survives
	 *   - No COMPLETED status is persisted
	 *   - The inbox record returns to its previous state
	 *
	 * @param input - Message identity and payload
	 * @param txFactory - Factory to create a new transaction
	 * @param handler - Business logic callback, receives { tx }
	 * @returns Result indicating consumption outcome
	 */
	async consume<TBody>(
		input: ConsumeInput,
		txFactory: TxFactory,
		handler: (ctx: { tx: TxClient }) => Promise<TBody>,
	): Promise<ConsumeResult<TBody>> {
		const { tx, commit, rollback } = await txFactory.begin();

		try {
			const result = await this.consumeWithTx(input, tx, async (innerTx) => {
				return handler({ tx: innerTx });
			});

			// Only commit if the acquisition was handled
			if (result.kind === "consumed") {
				await commit();
			} else {
				await rollback();
			}

			return result;
		} catch (error) {
			await rollback().catch(() => {
				/* best-effort rollback */
			});
			throw error;
		}
	}

	// ─── Internal primitive ───────────────────────────────────────────────

	/**
	 * consumeWithTx() — Internal primitive for composition.
	 *
	 * Works within an EXISTING transaction passed from outside.
	 * The caller is responsible for commit/rollback.
	 *
	 * Use this when the caller needs to perform additional operations
	 * atomically alongside the inbox update within the same transaction.
	 *
	 * @param input - Message identity and payload
	 * @param tx - Existing transaction client
	 * @param handler - Business logic callback
	 */
	async consumeWithTx<TBody>(
		input: ConsumeInput,
		tx: TxClient,
		handler: (tx: TxClient) => Promise<TBody>,
	): Promise<ConsumeResult<TBody>> {
		// Step 1: Compute deterministic payload hash
		const payloadHash = hashPayload({
			operation: `${input.consumerName}:${input.messageType}`,
			payloadVersion: input.payloadVersion,
			payload: input.payload,
		});

		// Step 2: Build acquire input
		const acquireInput: AcquireInput = {
			consumerName: input.consumerName,
			producer: input.producer,
			messageId: input.messageId,
			messageType: input.messageType,
			payloadHash,
			organizationId: input.organizationId,
			companyId: input.companyId,
			processingExpiresAt: new Date(Date.now() + DEFAULT_PROCESSING_TIMEOUT_MS),
		};

		// Step 3: Acquire inbox slot
		const acquisition = await this.inboxRepo.acquire(
			tx,
			acquireInput,
			DEFAULT_PROCESSING_TIMEOUT_MS,
		);

		// Step 4: Route by acquisition result
		switch (acquisition.kind) {
			case "ALREADY_COMPLETED":
				return {
					kind: "already-completed",
					acquisition,
				};

			case "CURRENTLY_PROCESSING":
			case "TERMINAL_FAILURE":
			case "PAYLOAD_CONFLICT":
				return {
					kind: "action-required",
					acquisition,
				};

			case "ACQUIRED":
				return this.handleAcquired(tx, acquisition, handler);
		}
	}

	// ─── Private handlers ─────────────────────────────────────────────────

	private async handleAcquired<TBody>(
		tx: TxClient,
		acquisition: {
			inboxId: string;
			processingToken: string;
			attemptCount: number;
		},
		handler: (tx: TxClient) => Promise<TBody>,
	): Promise<ConsumeResult<TBody>> {
		const result = await handler(tx);

		await this.inboxRepo.markCompleted(tx, {
			inboxId: acquisition.inboxId,
			processingToken: acquisition.processingToken,
		});

		return {
			kind: "consumed",
			inboxId: acquisition.inboxId,
			result,
			attemptCount: acquisition.attemptCount,
		};
	}
}
