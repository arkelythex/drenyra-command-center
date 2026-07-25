/**
 * ConsumeOnceWrapper — unit tests (W2-05C + W2-05D).
 *
 * Tests the transactional consumer wrapper with a mock inbox repository.
 * Real PostgreSQL integration is tested separately in consume-once.integration.test.ts.
 */

import { describe, expect, it, vi } from "vitest";
import { ConsumeOnceWrapper } from "../inbox/consume-once";
import type {
	InboxAcquisition,
	InboxRepository,
	TxClient,
} from "../inbox/repository-types";

const CONSUMER = "test-worker";
const PRODUCER = "SUNAT_CDR";
const MSG_ID = "msg-001";
const TOKEN = "token-001";
const INBOX_ID = "inbox-001";

const BASE_INPUT = {
	consumerName: CONSUMER,
	producer: PRODUCER,
	messageId: MSG_ID,
	messageType: "cdr.notification",
	payload: { cdr: "data" },
	payloadVersion: 1,
};

const MOCK_TX = { mock: true } as unknown as TxClient;

function mockRepo(acquisition: InboxAcquisition): InboxRepository {
	return {
		acquire: vi.fn().mockResolvedValue(acquisition),
		markCompleted: vi.fn().mockResolvedValue(undefined),
		markFailed: vi.fn().mockResolvedValue(undefined),
	};
}

// ═══════════════════════════════════════════════════════════════════════════
// consumeWithTx — internal primitive
// ═══════════════════════════════════════════════════════════════════════════

describe("ConsumeOnceWrapper.consumeWithTx (internal primitive)", () => {
	// ─── ACQUIRED: handler executed ──────────────────────────────────────

	it("ACQUIRED — executes handler and marks completed", async () => {
		const repo = mockRepo({
			kind: "ACQUIRED",
			inboxId: INBOX_ID,
			processingToken: TOKEN,
			attemptCount: 1,
		});
		const wrapper = new ConsumeOnceWrapper(repo);
		const handler = vi.fn().mockResolvedValue({ processed: true });

		const result = await wrapper.consumeWithTx(BASE_INPUT, MOCK_TX, handler);

		expect(result.kind).toBe("consumed");
		if (result.kind === "consumed") {
			expect(result.result).toEqual({ processed: true });
		}
		expect(handler).toHaveBeenCalledTimes(1);
		expect(repo.markCompleted).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				inboxId: INBOX_ID,
				processingToken: TOKEN,
			}),
		);
	});

	// ─── ALREADY_COMPLETED: handler NOT invoked ──────────────────────────

	it("ALREADY_COMPLETED — handler NOT invoked, returns already-completed", async () => {
		const repo = mockRepo({
			kind: "ALREADY_COMPLETED",
			resultMetadata: { status: "ok" },
		});
		const wrapper = new ConsumeOnceWrapper(repo);
		const handler = vi.fn();

		const result = await wrapper.consumeWithTx(BASE_INPUT, MOCK_TX, handler);

		expect(result.kind).toBe("already-completed");
		expect(handler).not.toHaveBeenCalled();
		expect(repo.markCompleted).not.toHaveBeenCalled();
	});

	// ─── CURRENTLY_PROCESSING: action required ───────────────────────────

	it("CURRENTLY_PROCESSING — returns action-required, handler NOT invoked", async () => {
		const repo = mockRepo({
			kind: "CURRENTLY_PROCESSING",
		});
		const wrapper = new ConsumeOnceWrapper(repo);
		const handler = vi.fn();

		const result = await wrapper.consumeWithTx(BASE_INPUT, MOCK_TX, handler);

		expect(result.kind).toBe("action-required");
		if (result.kind === "action-required") {
			expect(result.acquisition.kind).toBe("CURRENTLY_PROCESSING");
		}
		expect(handler).not.toHaveBeenCalled();
	});

	// ─── TERMINAL_FAILURE: action required ───────────────────────────────

	it("TERMINAL_FAILURE — returns action-required, handler NOT invoked", async () => {
		const repo = mockRepo({
			kind: "TERMINAL_FAILURE",
			failureCode: "INVALID_STATE",
		});
		const wrapper = new ConsumeOnceWrapper(repo);
		const handler = vi.fn();

		const result = await wrapper.consumeWithTx(BASE_INPUT, MOCK_TX, handler);

		expect(result.kind).toBe("action-required");
		if (result.kind === "action-required") {
			expect(result.acquisition.kind).toBe("TERMINAL_FAILURE");
		}
		expect(handler).not.toHaveBeenCalled();
	});

	// ─── PAYLOAD_CONFLICT: action required ───────────────────────────────

	it("PAYLOAD_CONFLICT — returns action-required, handler NOT invoked", async () => {
		const repo = mockRepo({
			kind: "PAYLOAD_CONFLICT",
			expectedHash: "abc",
		});
		const wrapper = new ConsumeOnceWrapper(repo);
		const handler = vi.fn();

		const result = await wrapper.consumeWithTx(BASE_INPUT, MOCK_TX, handler);

		expect(result.kind).toBe("action-required");
		if (result.kind === "action-required") {
			expect(result.acquisition.kind).toBe("PAYLOAD_CONFLICT");
		}
		expect(handler).not.toHaveBeenCalled();
	});

	// ─── Handler failure → error rethrown ────────────────────────────────

	it("handler error — rethrows, no markCompleted", async () => {
		const repo = mockRepo({
			kind: "ACQUIRED",
			inboxId: INBOX_ID,
			processingToken: TOKEN,
			attemptCount: 1,
		});
		const wrapper = new ConsumeOnceWrapper(repo);
		const handler = vi.fn().mockRejectedValue(new Error("handler failed"));

		await expect(
			wrapper.consumeWithTx(BASE_INPUT, MOCK_TX, handler),
		).rejects.toThrow("handler failed");

		expect(repo.markCompleted).not.toHaveBeenCalled();
	});

	// ─── Attempt count propagated ────────────────────────────────────────

	it("attemptCount from repository is propagated in result", async () => {
		const repo = mockRepo({
			kind: "ACQUIRED",
			inboxId: INBOX_ID,
			processingToken: TOKEN,
			attemptCount: 3,
		});
		const wrapper = new ConsumeOnceWrapper(repo);
		const handler = vi.fn().mockResolvedValue({ ok: true });

		const result = await wrapper.consumeWithTx(BASE_INPUT, MOCK_TX, handler);

		expect(result.kind).toBe("consumed");
		if (result.kind === "consumed") {
			expect(result.attemptCount).toBe(3);
		}
	});

	// ─── Payload hash computed deterministically ─────────────────────────

	it("same input produces same payload_hash (via acquire call)", async () => {
		const acquireA = vi.fn().mockResolvedValue({
			kind: "ACQUIRED" as const,
			inboxId: INBOX_ID,
			processingToken: TOKEN,
			attemptCount: 1,
		});
		const acquireB = vi.fn().mockResolvedValue({
			kind: "ACQUIRED" as const,
			inboxId: INBOX_ID,
			processingToken: TOKEN,
			attemptCount: 1,
		});

		const wrapperA = new ConsumeOnceWrapper({
			acquire: acquireA,
			markCompleted: vi.fn(),
			markFailed: vi.fn(),
		});
		const wrapperB = new ConsumeOnceWrapper({
			acquire: acquireB,
			markCompleted: vi.fn(),
			markFailed: vi.fn(),
		});

		await Promise.all([
			wrapperA.consumeWithTx(
				BASE_INPUT,
				MOCK_TX,
				vi.fn().mockResolvedValue({}),
			),
			wrapperB.consumeWithTx(
				BASE_INPUT,
				MOCK_TX,
				vi.fn().mockResolvedValue({}),
			),
		]);

		const hashA = acquireA.mock.calls[0][1].payloadHash;
		const hashB = acquireB.mock.calls[0][1].payloadHash;
		expect(hashA).toBe(hashB);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// consume — public safe API (transaction-managed)
// ═══════════════════════════════════════════════════════════════════════════

describe("ConsumeOnceWrapper.consume (public safe API)", () => {
	function mockTxFactory(_result?: { kind: string }) {
		const commit = vi.fn().mockResolvedValue(undefined);
		const rollback = vi.fn().mockResolvedValue(undefined);
		const txFactory = {
			begin: vi.fn().mockResolvedValue({
				tx: MOCK_TX,
				commit,
				rollback,
			}),
		};
		return { txFactory, commit, rollback };
	}

	it("ACQUIRED — begins tx, handles, commits, returns consumed", async () => {
		const repo = mockRepo({
			kind: "ACQUIRED",
			inboxId: INBOX_ID,
			processingToken: TOKEN,
			attemptCount: 1,
		});
		const wrapper = new ConsumeOnceWrapper(repo);
		const { txFactory, commit, rollback } = mockTxFactory();
		const handler = vi.fn().mockResolvedValue({ processed: true });

		const result = await wrapper.consume(BASE_INPUT, txFactory, handler);

		expect(result.kind).toBe("consumed");
		expect(txFactory.begin).toHaveBeenCalledTimes(1);
		expect(commit).toHaveBeenCalledTimes(1);
		expect(rollback).not.toHaveBeenCalled();
	});

	it("ALREADY_COMPLETED — begins tx, rolls back (no effect), handler NOT invoked", async () => {
		const repo = mockRepo({
			kind: "ALREADY_COMPLETED",
			resultMetadata: { status: "ok" },
		});
		const wrapper = new ConsumeOnceWrapper(repo);
		const { txFactory, commit, rollback } = mockTxFactory();
		const handler = vi.fn();

		const result = await wrapper.consume(BASE_INPUT, txFactory, handler);

		expect(result.kind).toBe("already-completed");
		expect(handler).not.toHaveBeenCalled();
		expect(commit).not.toHaveBeenCalled();
		expect(rollback).toHaveBeenCalledTimes(1);
	});

	it("handler fails — rolls back, no commit", async () => {
		const repo = mockRepo({
			kind: "ACQUIRED",
			inboxId: INBOX_ID,
			processingToken: TOKEN,
			attemptCount: 1,
		});
		const wrapper = new ConsumeOnceWrapper(repo);
		const { txFactory, commit, rollback } = mockTxFactory();
		const handler = vi.fn().mockRejectedValue(new Error("domain error"));

		await expect(
			wrapper.consume(BASE_INPUT, txFactory, handler),
		).rejects.toThrow("domain error");

		expect(commit).not.toHaveBeenCalled();
		expect(rollback).toHaveBeenCalledTimes(1);
	});

	it("markCompleted fails — rolls back, no commit", async () => {
		const repo = mockRepo({
			kind: "ACQUIRED",
			inboxId: INBOX_ID,
			processingToken: TOKEN,
			attemptCount: 1,
		});
		const wrapper = new ConsumeOnceWrapper(repo);
		const { txFactory, commit, rollback } = mockTxFactory();

		// markCompleted throws
		vi.spyOn(repo, "markCompleted").mockRejectedValue(
			new Error("markCompleted failed"),
		);

		const handler = vi.fn().mockResolvedValue({ ok: true });

		await expect(
			wrapper.consume(BASE_INPUT, txFactory, handler),
		).rejects.toThrow("markCompleted failed");

		expect(handler).toHaveBeenCalledTimes(1);
		expect(commit).not.toHaveBeenCalled();
		expect(rollback).toHaveBeenCalledTimes(1);
	});

	it("CURRENTLY_PROCESSING — rolls back, no handler", async () => {
		const repo = mockRepo({
			kind: "CURRENTLY_PROCESSING",
		});
		const wrapper = new ConsumeOnceWrapper(repo);
		const { txFactory, commit, rollback } = mockTxFactory();
		const handler = vi.fn();

		const result = await wrapper.consume(BASE_INPUT, txFactory, handler);

		expect(result.kind).toBe("action-required");
		expect(handler).not.toHaveBeenCalled();
		expect(commit).not.toHaveBeenCalled();
		expect(rollback).toHaveBeenCalledTimes(1);
	});

	it("PAYLOAD_CONFLICT — rolls back, no handler", async () => {
		const repo = mockRepo({
			kind: "PAYLOAD_CONFLICT",
			expectedHash: "abc",
		});
		const wrapper = new ConsumeOnceWrapper(repo);
		const { txFactory, commit, rollback } = mockTxFactory();
		const handler = vi.fn();

		const result = await wrapper.consume(BASE_INPUT, txFactory, handler);

		expect(result.kind).toBe("action-required");
		expect(handler).not.toHaveBeenCalled();
		expect(commit).not.toHaveBeenCalled();
		expect(rollback).toHaveBeenCalledTimes(1);
	});

	it("TERMINAL_FAILURE — rolls back, no handler", async () => {
		const repo = mockRepo({
			kind: "TERMINAL_FAILURE",
			failureCode: "INVALID_STATE",
		});
		const wrapper = new ConsumeOnceWrapper(repo);
		const { txFactory, commit, rollback } = mockTxFactory();
		const handler = vi.fn();

		const result = await wrapper.consume(BASE_INPUT, txFactory, handler);

		expect(result.kind).toBe("action-required");
		expect(handler).not.toHaveBeenCalled();
		expect(commit).not.toHaveBeenCalled();
		expect(rollback).toHaveBeenCalledTimes(1);
	});

	it("rollback error on handler failure does not mask original error", async () => {
		const repo = mockRepo({
			kind: "ACQUIRED",
			inboxId: INBOX_ID,
			processingToken: TOKEN,
			attemptCount: 1,
		});
		const wrapper = new ConsumeOnceWrapper(repo);
		const rollback = vi
			.fn()
			.mockRejectedValue(new Error("rollback also failed"));
		const txFactory = {
			begin: vi.fn().mockResolvedValue({
				tx: MOCK_TX,
				commit: vi.fn(),
				rollback,
			}),
		};

		const handler = vi.fn().mockRejectedValue(new Error("original error"));

		await expect(
			wrapper.consume(BASE_INPUT, txFactory, handler),
		).rejects.toThrow("original error");
	});
});
