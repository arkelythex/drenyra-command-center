import { describe, it, expect } from "vitest";
import {
	createExecutionId,
	LIFECYCLE_STATE,
	ATTENTION_STATE,
} from "@drenyra/workspace-domain";
import { AUTHORITY_LEVEL, STATE_SOURCE } from "@drenyra/workspace-application";
import {
	InMemoryEventStore,
	CURRENT_EVENT_SCHEMA_VERSION,
	type DomainEvent,
} from "@drenyra/workspace-projections";
import { InMemoryNotificationRouter } from "../notifications/notification-router";
import { InMemorySubscriptionStore } from "../notifications/subscription";
import { WaitService } from "../notifications/wait-service";
import { WaitTimeoutError } from "../notifications/errors";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeEvent(overrides: Partial<DomainEvent> = {}): DomainEvent {
	return {
		eventId: crypto.randomUUID(),
		executionId: createExecutionId(),
		sequence: 1,
		type: "execution.started",
		payload: {},
		authority: AUTHORITY_LEVEL.OBSERVED,
		source: STATE_SOURCE.PI,
		timestamp: "2026-07-15T10:00:00.000Z",
		schemaVersion: CURRENT_EVENT_SCHEMA_VERSION,
		...overrides,
	};
}

function createStoreWithExecution(overrides: Partial<DomainEvent> = {}): {
	store: InMemoryEventStore;
	executionId: ReturnType<typeof createExecutionId>;
} {
	const store = new InMemoryEventStore();
	const executionId = createExecutionId();
	store.append(
		makeEvent({
			executionId,
			type: "execution.started",
			sequence: 1,
			...overrides,
		}),
	);
	return { store, executionId };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("WaitService", () => {
	describe("fast path — already in target state", () => {
		it("should resolve immediately when execution is already completed", async () => {
			const store = new InMemoryEventStore();
			const executionId = createExecutionId();
			store.append(
				makeEvent({ executionId, type: "execution.started", sequence: 1 }),
			);
			store.append(
				makeEvent({
					executionId,
					type: "execution.completed",
					sequence: 2,
				}),
			);

			const subStore = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(subStore);
			const waitService = new WaitService(store, router);

			const start = Date.now();
			const result = await waitService.waitUntilCompleted(executionId, 5000);
			const elapsed = Date.now() - start;

			expect(result.executionId).toBe(executionId);
			expect(result.finalState.lifecycle).toBe(LIFECYCLE_STATE.COMPLETED);
			expect(result.waitedMs).toBeLessThan(50); // near-instant
			expect(elapsed).toBeLessThan(50);
		});

		it("should resolve immediately when already in target lifecycle via waitUntil", async () => {
			const store = new InMemoryEventStore();
			const executionId = createExecutionId();
			store.append(
				makeEvent({ executionId, type: "execution.started", sequence: 1 }),
			);
			store.append(
				makeEvent({
					executionId,
					type: "execution.completed",
					sequence: 2,
				}),
			);

			const subStore = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(subStore);
			const waitService = new WaitService(store, router);

			const start = Date.now();
			const result = await waitService.waitUntil(
				executionId,
				LIFECYCLE_STATE.COMPLETED,
				5000,
			);
			const elapsed = Date.now() - start;

			expect(result.executionId).toBe(executionId);
			expect(result.finalState.lifecycle).toBe(LIFECYCLE_STATE.COMPLETED);
			expect(result.waitedMs).toBeLessThan(50);
			expect(elapsed).toBeLessThan(50);
		});

		it("should resolve immediately when already blocked via waitUntilBlocked", async () => {
			const store = new InMemoryEventStore();
			const executionId = createExecutionId();
			store.append(
				makeEvent({ executionId, type: "execution.started", sequence: 1 }),
			);
			store.append(
				makeEvent({
					executionId,
					type: "execution.attention.changed",
					sequence: 2,
					payload: { attention: ATTENTION_STATE.BLOCKED },
				}),
			);

			const subStore = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(subStore);
			const waitService = new WaitService(store, router);

			const start = Date.now();
			const result = await waitService.waitUntilBlocked(executionId, 5000);
			const elapsed = Date.now() - start;

			expect(result.finalState.attention).toBe(ATTENTION_STATE.BLOCKED);
			expect(elapsed).toBeLessThan(50);
		});

		it("should resolve immediately for waitForAttention when already in target attention", async () => {
			const store = new InMemoryEventStore();
			const executionId = createExecutionId();
			store.append(
				makeEvent({ executionId, type: "execution.started", sequence: 1 }),
			);
			store.append(
				makeEvent({
					executionId,
					type: "execution.attention.changed",
					sequence: 2,
					payload: { attention: ATTENTION_STATE.APPROVAL_REQUIRED },
				}),
			);

			const subStore = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(subStore);
			const waitService = new WaitService(store, router);

			const start = Date.now();
			const result = await waitService.waitForAttention(
				executionId,
				ATTENTION_STATE.APPROVAL_REQUIRED,
				5000,
			);
			const elapsed = Date.now() - start;

			expect(result.finalState.attention).toBe(
				ATTENTION_STATE.APPROVAL_REQUIRED,
			);
			expect(elapsed).toBeLessThan(50);
		});
	});

	describe("polling — state changes detected via EventStore", () => {
		it("should resolve when lifecycle changes to the target state", async () => {
			const { store, executionId } = createStoreWithExecution();

			const subStore = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(subStore);
			const waitService = new WaitService(store, router);

			// Start waiting
			const waitPromise = waitService.waitUntil(
				executionId,
				LIFECYCLE_STATE.COMPLETED,
				5000,
			);

			// Append completion after a short delay
			await new Promise((resolve) => setTimeout(resolve, 20));
			store.append(
				makeEvent({
					executionId,
					type: "execution.completed",
					sequence: 2,
				}),
			);

			const result = await waitPromise;
			expect(result.executionId).toBe(executionId);
			expect(result.finalState.lifecycle).toBe(LIFECYCLE_STATE.COMPLETED);
			expect(result.waitedMs).toBeGreaterThan(0);
		});

		it("should resolve when attention changes to blocked", async () => {
			const { store, executionId } = createStoreWithExecution();

			const subStore = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(subStore);
			const waitService = new WaitService(store, router);

			const waitPromise = waitService.waitUntilBlocked(executionId, 5000);

			await new Promise((resolve) => setTimeout(resolve, 20));
			store.append(
				makeEvent({
					executionId,
					type: "execution.attention.changed",
					sequence: 2,
					payload: { attention: ATTENTION_STATE.BLOCKED },
				}),
			);

			const result = await waitPromise;
			expect(result.finalState.attention).toBe(ATTENTION_STATE.BLOCKED);
		});

		it("should resolve when attention changes to approval-required", async () => {
			const { store, executionId } = createStoreWithExecution();

			const subStore = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(subStore);
			const waitService = new WaitService(store, router);

			const waitPromise = waitService.waitUntilApprovalRequired(
				executionId,
				5000,
			);

			await new Promise((resolve) => setTimeout(resolve, 20));
			store.append(
				makeEvent({
					executionId,
					type: "execution.attention.changed",
					sequence: 2,
					payload: { attention: ATTENTION_STATE.APPROVAL_REQUIRED },
				}),
			);

			const result = await waitPromise;
			expect(result.finalState.attention).toBe(
				ATTENTION_STATE.APPROVAL_REQUIRED,
			);
		});

		it("should resolve for specific attention via waitForAttention", async () => {
			const { store, executionId } = createStoreWithExecution();

			const subStore = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(subStore);
			const waitService = new WaitService(store, router);

			const waitPromise = waitService.waitForAttention(
				executionId,
				ATTENTION_STATE.CRITICAL,
				5000,
			);

			await new Promise((resolve) => setTimeout(resolve, 20));
			store.append(
				makeEvent({
					executionId,
					type: "execution.attention.changed",
					sequence: 2,
					payload: { attention: ATTENTION_STATE.CRITICAL },
				}),
			);

			const result = await waitPromise;
			expect(result.finalState.attention).toBe(ATTENTION_STATE.CRITICAL);
		});
	});

	describe("timeout", () => {
		it("should reject with WaitTimeoutError when target state is never reached", async () => {
			const { store, executionId } = createStoreWithExecution();

			const subStore = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(subStore);
			const waitService = new WaitService(store, router);

			// Target: COMPLETED, but we're still RUNNING and won't change
			// Short timeout to keep test fast
			await expect(
				waitService.waitUntil(executionId, LIFECYCLE_STATE.COMPLETED, 10),
			).rejects.toThrow(WaitTimeoutError);

			// Verify it's the right error type with correct properties
			try {
				await waitService.waitUntil(executionId, LIFECYCLE_STATE.COMPLETED, 10);
			} catch (err) {
				expect(err).toBeInstanceOf(WaitTimeoutError);
				const timeoutErr = err as WaitTimeoutError;
				expect(timeoutErr.executionId).toBe(executionId);
				expect(timeoutErr.timeoutMs).toBe(10);
			}
		});
	});

	describe("multiple waits", () => {
		it("should resolve both waits independently for the same execution", async () => {
			const { store, executionId } = createStoreWithExecution();

			const subStore = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(subStore);
			const waitService = new WaitService(store, router);

			const promise1 = waitService.waitUntil(
				executionId,
				LIFECYCLE_STATE.COMPLETED,
				5000,
			);
			const promise2 = waitService.waitUntil(
				executionId,
				LIFECYCLE_STATE.COMPLETED,
				5000,
			);

			await new Promise((resolve) => setTimeout(resolve, 20));
			store.append(
				makeEvent({
					executionId,
					type: "execution.completed",
					sequence: 2,
				}),
			);

			const [result1, result2] = await Promise.all([promise1, promise2]);
			expect(result1.executionId).toBe(executionId);
			expect(result2.executionId).toBe(executionId);
			expect(result1.finalState.lifecycle).toBe(LIFECYCLE_STATE.COMPLETED);
			expect(result2.finalState.lifecycle).toBe(LIFECYCLE_STATE.COMPLETED);
		});
	});

	describe("waitUntilCompleted with isTerminal", () => {
		it("should resolve for FAILED state (terminal)", async () => {
			const store = new InMemoryEventStore();
			const executionId = createExecutionId();
			store.append(
				makeEvent({ executionId, type: "execution.started", sequence: 1 }),
			);
			store.append(
				makeEvent({
					executionId,
					type: "execution.failed",
					sequence: 2,
				}),
			);

			const subStore = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(subStore);
			const waitService = new WaitService(store, router);

			const result = await waitService.waitUntilCompleted(executionId, 5000);
			expect(result.finalState.lifecycle).toBe(LIFECYCLE_STATE.FAILED);
		});

		it("should resolve for CANCELLED state (terminal)", async () => {
			const store = new InMemoryEventStore();
			const executionId = createExecutionId();
			store.append(
				makeEvent({ executionId, type: "execution.started", sequence: 1 }),
			);
			store.append(
				makeEvent({
					executionId,
					type: "execution.cancelled",
					sequence: 2,
				}),
			);

			const subStore = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(subStore);
			const waitService = new WaitService(store, router);

			const result = await waitService.waitUntilCompleted(executionId, 5000);
			expect(result.finalState.lifecycle).toBe(LIFECYCLE_STATE.CANCELLED);
		});
	});
});
