/**
 * IdempotencyApplicationService — unit tests (W2-03C).
 *
 * Tests the orchestration layer with a mock repository.
 * Integration with real PostgreSQL is tested in W2-03B and W2-03B.1.
 *
 * Key invariants tested:
 * - Handler invoked only on "acquired"
 * - Replay returns stored response without handler invocation
 * - Errors classified correctly via onFailure disposition
 * - Ownership fencing token propagated to markCompleted/markFailed
 * - Headers filtered through whitelist
 * - Functional 409/422 stored as COMPLETED
 * - Unknown errors cause rollback (no markFailed persisted)
 */

import { describe, expect, it, vi } from "vitest";
import { IdempotencyApplicationService } from "../idempotency/idempotency.service";
import type {
	AcquireDecision,
	IdempotencyRepository,
} from "../idempotency/repository-types";
import {
	IdempotencyInProgressError,
	IdempotencyPayloadMismatchError,
	IdempotencyTerminalFailureError,
} from "../idempotency/errors";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const ORG = "test-org";
const COMPANY = "test-company";
const OP = "test.op:v1";
const KEY = "test-key-001";
const TOKEN = "ownership-token-001";
const RECORD_ID = "record-001";

const BASE_INPUT = {
	organizationId: ORG,
	companyId: COMPANY,
	operation: OP,
	idempotencyKey: KEY,
	payloadVersion: 1,
	command: { amount: 100 },
	ttlMs: 3600_000,
	processingTimeoutMs: 5000,
};

// ─── Mock helpers ────────────────────────────────────────────────────────────

function mockRepo(decision: AcquireDecision): IdempotencyRepository {
	return {
		acquire: vi.fn().mockResolvedValue(decision),
		markCompleted: vi.fn().mockResolvedValue(undefined),
		markFailed: vi.fn().mockResolvedValue(undefined),
	};
}

function mockHandler<T>(response: T) {
	return vi.fn().mockResolvedValue(response);
}

function mockErrorHandler(error: Error) {
	return vi.fn().mockRejectedValue(error);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("IdempotencyApplicationService", () => {
	// ═════════════════════════════════════════════════════════════════════
	// Handler invocation
	// ═════════════════════════════════════════════════════════════════════

	it("executed — handler invoked exactly once", async () => {
		const repo = mockRepo({
			kind: "acquired",
			recordId: RECORD_ID,
			ownershipToken: TOKEN,
			attemptCount: 1,
		});
		const service = new IdempotencyApplicationService(repo);
		const handler = mockHandler({ status: 201, body: { id: "case-1" } });

		const result = await service.execute(BASE_INPUT, {} as never, handler);

		expect(result.kind).toBe("executed");
		if (result.kind === "executed") {
			expect(result.response.status).toBe(201);
			expect(result.response.body).toEqual({ id: "case-1" });
			expect(result.attemptCount).toBe(1);
		}
		expect(handler).toHaveBeenCalledTimes(1);
		expect(repo.markCompleted).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				recordId: RECORD_ID,
				ownershipToken: TOKEN,
				responseStatus: 201,
			}),
		);
	});

	it("replayed — handler NOT invoked", async () => {
		const repo = mockRepo({
			kind: "completed",
			recordId: RECORD_ID,
			responseStatus: 200,
			responseBody: { cached: true },
		});
		const service = new IdempotencyApplicationService(repo);
		const handler = mockHandler({
			status: 201,
			body: { shouldNotHappen: true },
		});

		const result = await service.execute(BASE_INPUT, {} as never, handler);

		expect(result.kind).toBe("replayed");
		if (result.kind === "replayed") {
			expect(result.response.status).toBe(200);
			expect(result.response.body).toEqual({ cached: true });
		}
		expect(handler).not.toHaveBeenCalled();
		expect(repo.markCompleted).not.toHaveBeenCalled();
	});

	it("payload-mismatch — handler NOT invoked, throws typed error", async () => {
		const repo = mockRepo({
			kind: "payload-mismatch",
			recordId: RECORD_ID,
		});
		const service = new IdempotencyApplicationService(repo);
		const handler = mockHandler({ status: 201, body: {} });

		await expect(
			service.execute(BASE_INPUT, {} as never, handler),
		).rejects.toThrow(IdempotencyPayloadMismatchError);
		expect(handler).not.toHaveBeenCalled();
	});

	it("in-progress — handler NOT invoked, throws typed error", async () => {
		const repo = mockRepo({
			kind: "in-progress",
			recordId: RECORD_ID,
		});
		const service = new IdempotencyApplicationService(repo);
		const handler = mockHandler({ status: 201, body: {} });

		await expect(
			service.execute(BASE_INPUT, {} as never, handler),
		).rejects.toThrow(IdempotencyInProgressError);
		expect(handler).not.toHaveBeenCalled();
	});

	it("terminal-failure — handler NOT invoked, throws typed error with failureCode", async () => {
		const repo = mockRepo({
			kind: "terminal-failure",
			recordId: RECORD_ID,
			failureCode: "FORBIDDEN_PERIOD",
		});
		const service = new IdempotencyApplicationService(repo);
		const handler = mockHandler({ status: 201, body: {} });

		await expect(
			service.execute(BASE_INPUT, {} as never, handler),
		).rejects.toThrow(IdempotencyTerminalFailureError);
		await expect(
			service.execute(BASE_INPUT, {} as never, handler),
		).rejects.toMatchObject({ failureCode: "FORBIDDEN_PERIOD" });
		expect(handler).not.toHaveBeenCalled();
	});

	// ═════════════════════════════════════════════════════════════════════
	// Response codes
	// ═════════════════════════════════════════════════════════════════════

	it("stores and replays 201 responses", async () => {
		const repo = mockRepo({
			kind: "acquired",
			recordId: RECORD_ID,
			ownershipToken: TOKEN,
			attemptCount: 1,
		});
		const service = new IdempotencyApplicationService(repo);

		await service.execute(
			BASE_INPUT,
			{} as never,
			mockHandler({ status: 201, body: { id: "x" } }),
		);

		expect(repo.markCompleted).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				responseStatus: 201,
				responseBody: { id: "x" },
			}),
		);
	});

	it("stores and replays 204 with null body", async () => {
		const repo = mockRepo({
			kind: "acquired",
			recordId: RECORD_ID,
			ownershipToken: TOKEN,
			attemptCount: 1,
		});
		const service = new IdempotencyApplicationService(repo);

		const result = await service.execute(
			BASE_INPUT,
			{} as never,
			mockHandler({ status: 204, body: null }),
		);

		expect(result.kind).toBe("executed");
		if (result.kind === "executed") {
			expect(result.response.status).toBe(204);
			expect(result.response.body).toBeNull();
		}
	});

	it("stores functional 409 as COMPLETED (not FAILED)", async () => {
		const repo = mockRepo({
			kind: "acquired",
			recordId: RECORD_ID,
			ownershipToken: TOKEN,
			attemptCount: 1,
		});
		const service = new IdempotencyApplicationService(repo);
		const handler = vi.fn().mockImplementation(() => {
			// Business rule: duplicate detected
			return { status: 409, body: { error: "duplicate entry" } };
		});

		const result = await service.execute(BASE_INPUT, {} as never, handler);

		expect(result.kind).toBe("executed");
		expect(repo.markCompleted).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ responseStatus: 409 }),
		);
		expect(repo.markFailed).not.toHaveBeenCalled();
	});

	it("stores functional 422 as COMPLETED (not FAILED)", async () => {
		const repo = mockRepo({
			kind: "acquired",
			recordId: RECORD_ID,
			ownershipToken: TOKEN,
			attemptCount: 1,
		});
		const service = new IdempotencyApplicationService(repo);
		const handler = vi.fn().mockResolvedValue({
			status: 422,
			body: { error: "validation failed" },
		});

		const result = await service.execute(BASE_INPUT, {} as never, handler);

		expect(result.kind).toBe("executed");
		expect(repo.markCompleted).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ responseStatus: 422 }),
		);
	});

	// ═════════════════════════════════════════════════════════════════════
	// Header whitelist
	// ═════════════════════════════════════════════════════════════════════

	it("preserves allowed headers (content-type, location, etag)", async () => {
		const repo = mockRepo({
			kind: "acquired",
			recordId: RECORD_ID,
			ownershipToken: TOKEN,
			attemptCount: 1,
		});
		const service = new IdempotencyApplicationService(repo);

		await service.execute(
			BASE_INPUT,
			{} as never,
			mockHandler({
				status: 201,
				body: null,
				headers: {
					"content-type": "application/json",
					location: "/cases/123",
					etag: "abc123",
					"set-cookie": "session=secret",
					authorization: "Bearer token",
				},
			}),
		);

		expect(repo.markCompleted).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				responseHeaders: {
					"content-type": "application/json",
					location: "/cases/123",
					etag: "abc123",
				},
			}),
		);
	});

	it("ignores volatile and sensitive headers", async () => {
		const repo = mockRepo({
			kind: "acquired",
			recordId: RECORD_ID,
			ownershipToken: TOKEN,
			attemptCount: 1,
		});
		const service = new IdempotencyApplicationService(repo);

		await service.execute(
			BASE_INPUT,
			{} as never,
			mockHandler({
				status: 200,
				body: null,
				headers: { "set-cookie": "sensitive", "x-api-key": "secret" },
			}),
		);

		expect(repo.markCompleted).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ responseHeaders: {} }),
		);
	});

	// ═════════════════════════════════════════════════════════════════════
	// Failure classification
	// ═════════════════════════════════════════════════════════════════════

	it("functional-response disposition stores as COMPLETED", async () => {
		const repo = mockRepo({
			kind: "acquired",
			recordId: RECORD_ID,
			ownershipToken: TOKEN,
			attemptCount: 1,
		});
		const service = new IdempotencyApplicationService(repo);
		const handler = mockErrorHandler(new Error("duplicate"));
		const onFailure = () =>
			({
				kind: "functional-response",
				response: { status: 409, body: { error: "duplicate" } },
			}) as const;

		const result = await service.execute(
			BASE_INPUT,
			{} as never,
			handler,
			onFailure,
		);

		expect(result.kind).toBe("executed");
		expect(repo.markCompleted).toHaveBeenCalled();
		expect(repo.markFailed).not.toHaveBeenCalled();
	});

	it("retryable disposition stores FAILED(RETRYABLE) and rethrows", async () => {
		const repo = mockRepo({
			kind: "acquired",
			recordId: RECORD_ID,
			ownershipToken: TOKEN,
			attemptCount: 1,
		});
		const service = new IdempotencyApplicationService(repo);
		const error = new Error("timeout");
		const handler = mockErrorHandler(error);
		const onFailure = () => ({ kind: "retryable", code: "TIMEOUT" }) as const;

		await expect(
			service.execute(BASE_INPUT, {} as never, handler, onFailure),
		).rejects.toThrow("timeout");

		expect(repo.markFailed).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				failureCode: "TIMEOUT",
				failureClass: "RETRYABLE",
				ownershipToken: TOKEN,
			}),
		);
	});

	it("terminal disposition stores FAILED(TERMINAL) and rethrows", async () => {
		const repo = mockRepo({
			kind: "acquired",
			recordId: RECORD_ID,
			ownershipToken: TOKEN,
			attemptCount: 1,
		});
		const service = new IdempotencyApplicationService(repo);
		const error = new Error("invalid state");
		const handler = mockErrorHandler(error);
		const onFailure = () =>
			({ kind: "terminal", code: "INVALID_STATE" }) as const;

		await expect(
			service.execute(BASE_INPUT, {} as never, handler, onFailure),
		).rejects.toThrow("invalid state");

		expect(repo.markFailed).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				failureCode: "INVALID_STATE",
				failureClass: "TERMINAL",
			}),
		);
	});

	it("rollback-only disposition does NOT persist FAILED", async () => {
		const repo = mockRepo({
			kind: "acquired",
			recordId: RECORD_ID,
			ownershipToken: TOKEN,
			attemptCount: 1,
		});
		const service = new IdempotencyApplicationService(repo);
		const error = new Error("unknown");
		const handler = mockErrorHandler(error);
		const onFailure = () => ({ kind: "rollback-only" }) as const;

		await expect(
			service.execute(BASE_INPUT, {} as never, handler, onFailure),
		).rejects.toThrow("unknown");

		expect(repo.markCompleted).not.toHaveBeenCalled();
		expect(repo.markFailed).not.toHaveBeenCalled();
	});

	it("no onFailure classifier — error rethrown without persisting state", async () => {
		const repo = mockRepo({
			kind: "acquired",
			recordId: RECORD_ID,
			ownershipToken: TOKEN,
			attemptCount: 1,
		});
		const service = new IdempotencyApplicationService(repo);
		const handler = mockErrorHandler(new Error("unexpected"));

		await expect(
			service.execute(BASE_INPUT, {} as never, handler),
		).rejects.toThrow("unexpected");

		expect(repo.markCompleted).not.toHaveBeenCalled();
		expect(repo.markFailed).not.toHaveBeenCalled();
	});

	// ═════════════════════════════════════════════════════════════════════
	// Ownership token propagation
	// ═════════════════════════════════════════════════════════════════════

	it("executed — ownershipToken propagated to markCompleted", async () => {
		const repo = mockRepo({
			kind: "acquired",
			recordId: RECORD_ID,
			ownershipToken: "my-token-42",
			attemptCount: 3,
		});
		const service = new IdempotencyApplicationService(repo);

		await service.execute(
			BASE_INPUT,
			{} as never,
			mockHandler({ status: 200, body: null }),
		);

		expect(repo.markCompleted).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ ownershipToken: "my-token-42" }),
		);
	});

	it("retryable — ownershipToken propagated to markFailed", async () => {
		const repo = mockRepo({
			kind: "acquired",
			recordId: RECORD_ID,
			ownershipToken: "my-token-99",
			attemptCount: 2,
		});
		const service = new IdempotencyApplicationService(repo);
		const handler = mockErrorHandler(new Error("db down"));
		const onFailure = () =>
			({ kind: "retryable", code: "DB_TIMEOUT" }) as const;

		await expect(
			service.execute(BASE_INPUT, {} as never, handler, onFailure),
		).rejects.toThrow();

		expect(repo.markFailed).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ ownershipToken: "my-token-99" }),
		);
	});

	// ═════════════════════════════════════════════════════════════════════
	// Attempt count
	// ═════════════════════════════════════════════════════════════════════

	it("executed result includes attemptCount from repository", async () => {
		const repo = mockRepo({
			kind: "acquired",
			recordId: RECORD_ID,
			ownershipToken: TOKEN,
			attemptCount: 3,
		});
		const service = new IdempotencyApplicationService(repo);

		const result = await service.execute(
			BASE_INPUT,
			{} as never,
			mockHandler({ status: 200, body: null }),
		);

		expect(result.kind).toBe("executed");
		if (result.kind === "executed") {
			expect(result.attemptCount).toBe(3);
		}
	});

	it("replayed result includes attemptCount", async () => {
		const repo = mockRepo({
			kind: "completed",
			recordId: RECORD_ID,
			responseStatus: 200,
			responseBody: null,
		});
		const service = new IdempotencyApplicationService(repo);

		const result = await service.execute(
			BASE_INPUT,
			{} as never,
			mockHandler({ status: 201, body: {} }),
		);

		expect(result.kind).toBe("replayed");
		if (result.kind === "replayed") {
			expect(result.attemptCount).toBe(1);
		}
	});

	// ═════════════════════════════════════════════════════════════════════
	// Concurrent execution fence
	// ═════════════════════════════════════════════════════════════════════

	it("two concurrent acquires — only one handler invoked", async () => {
		// This is an integration concern validated in W2-03B/W2-03B.1.
		// Here we verify that the service correctly delegates to the repository
		// which is the authority on ownership.
		const repo = mockRepo({
			kind: "in-progress",
			recordId: RECORD_ID,
		});
		const service = new IdempotencyApplicationService(repo);
		const handler = mockHandler({ status: 200, body: null });

		await expect(
			service.execute(BASE_INPUT, {} as never, handler),
		).rejects.toThrow(IdempotencyInProgressError);
		expect(handler).not.toHaveBeenCalled();
	});
});
