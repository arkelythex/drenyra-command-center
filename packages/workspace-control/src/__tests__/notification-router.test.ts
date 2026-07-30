import { describe, it, expect, vi } from "vitest";
import {
	createExecutionId,
	ATTENTION_STATE,
	LIFECYCLE_STATE,
	PROJECTED_RISK_TIER,
	createOperationalState,
	type OperationalState,
} from "@drenyra/workspace-domain";
import type {
	ExecutionSubscription,
	StateNotification,
} from "../notifications/types";
import { InMemoryNotificationRouter } from "../notifications/notification-router";
import { InMemorySubscriptionStore } from "../notifications/subscription";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSubscription(
	overrides: Partial<ExecutionSubscription> = {},
): ExecutionSubscription {
	return {
		subscriptionId: crypto.randomUUID(),
		executionId: createExecutionId(),
		subscriberId: "subscriber-1",
		events: [{ kind: "any-state-change" }],
		createdAt: "2026-07-15T10:00:00.000Z",
		...overrides,
	};
}

function makeDefaultState(): OperationalState {
	return createOperationalState({ lifecycle: LIFECYCLE_STATE.RUNNING });
}

function makeNotification(
	overrides: Partial<StateNotification> = {},
): StateNotification {
	const defaultState = makeDefaultState();
	return {
		notificationId: crypto.randomUUID(),
		subscriptionId: "sub-1",
		executionId: createExecutionId(),
		event: { kind: "any-state-change" },
		previousState: defaultState,
		currentState: defaultState,
		timestamp: "2026-07-15T10:00:00.000Z",
		...overrides,
	};
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("InMemoryNotificationRouter", () => {
	describe("subscribe and unsubscribe", () => {
		it("should return subscriptionId on subscribe", () => {
			const store = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(store);
			const sub = makeSubscription();

			const id = router.subscribe(sub);
			expect(id).toBe(sub.subscriptionId);
		});

		it("should return true when unsubscribing existing subscription", () => {
			const store = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(store);
			const sub = makeSubscription();

			router.subscribe(sub);
			const removed = router.unsubscribe(sub.subscriptionId);
			expect(removed).toBe(true);
		});

		it("should return false when unsubscribing non-existent subscription", () => {
			const store = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(store);

			const removed = router.unsubscribe("non-existent");
			expect(removed).toBe(false);
		});
	});

	describe("publish — matching by executionId + event kind", () => {
		it("should call handler when exact event kind matches subscription", () => {
			const store = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(store);
			const handler = vi.fn();
			router.addHandler(handler);

			const executionId = createExecutionId();
			const sub = makeSubscription({
				executionId,
				events: [{ kind: "lifecycle-changed", to: LIFECYCLE_STATE.COMPLETED }],
			});
			router.subscribe(sub);

			const notification = makeNotification({
				executionId,
				event: { kind: "lifecycle-changed", to: LIFECYCLE_STATE.COMPLETED },
			});
			router.publish(notification);

			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler).toHaveBeenCalledWith(notification);
		});

		it("should NOT call handler when event kind does not match", () => {
			const store = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(store);
			const handler = vi.fn();
			router.addHandler(handler);

			const executionId = createExecutionId();
			const sub = makeSubscription({
				executionId,
				events: [{ kind: "lifecycle-changed", to: LIFECYCLE_STATE.COMPLETED }],
			});
			router.subscribe(sub);

			const notification = makeNotification({
				executionId,
				event: { kind: "lifecycle-changed", to: LIFECYCLE_STATE.FAILED },
			});
			router.publish(notification);

			expect(handler).not.toHaveBeenCalled();
		});

		it("should NOT call handler for different executionId", () => {
			const store = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(store);
			const handler = vi.fn();
			router.addHandler(handler);

			const sub = makeSubscription({
				events: [{ kind: "any-state-change" }],
			});
			router.subscribe(sub);

			const notification = makeNotification({
				executionId: createExecutionId(), // different
				event: { kind: "any-state-change" },
			});
			router.publish(notification);

			expect(handler).not.toHaveBeenCalled();
		});
	});

	describe("publish — wildcard matching", () => {
		it('should match "any-state-change" for any event kind', () => {
			const store = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(store);
			const handler = vi.fn();
			router.addHandler(handler);

			const executionId = createExecutionId();
			const sub = makeSubscription({
				executionId,
				events: [{ kind: "any-state-change" }],
			});
			router.subscribe(sub);

			// Should match lifecycle-changed
			router.publish(
				makeNotification({
					executionId,
					event: { kind: "lifecycle-changed", to: LIFECYCLE_STATE.COMPLETED },
				}),
			);
			// Should match attention-changed
			router.publish(
				makeNotification({
					executionId,
					event: { kind: "attention-changed", to: ATTENTION_STATE.BLOCKED },
				}),
			);
			// Should match execution-completed
			router.publish(
				makeNotification({
					executionId,
					event: { kind: "execution-completed" },
				}),
			);

			expect(handler).toHaveBeenCalledTimes(3);
		});

		it("should NOT match wildcard for different executionId", () => {
			const store = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(store);
			const handler = vi.fn();
			router.addHandler(handler);

			const sub = makeSubscription({
				events: [{ kind: "any-state-change" }],
			});
			router.subscribe(sub);

			router.publish(
				makeNotification({
					executionId: createExecutionId(), // different
					event: { kind: "execution-completed" },
				}),
			);

			expect(handler).not.toHaveBeenCalled();
		});
	});

	describe("publish — execution-blocked matching", () => {
		it('should match "execution-blocked" subscription when attention is blocked', () => {
			const store = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(store);
			const handler = vi.fn();
			router.addHandler(handler);

			const executionId = createExecutionId();
			const sub = makeSubscription({
				executionId,
				events: [{ kind: "execution-blocked" }],
			});
			router.subscribe(sub);

			const notification = makeNotification({
				executionId,
				event: { kind: "attention-changed", to: ATTENTION_STATE.BLOCKED },
			});
			router.publish(notification);

			expect(handler).toHaveBeenCalledTimes(1);
		});

		it('should NOT match "execution-blocked" for non-blocked attention', () => {
			const store = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(store);
			const handler = vi.fn();
			router.addHandler(handler);

			const executionId = createExecutionId();
			const sub = makeSubscription({
				executionId,
				events: [{ kind: "execution-blocked" }],
			});
			router.subscribe(sub);

			const notification = makeNotification({
				executionId,
				event: { kind: "attention-changed", to: ATTENTION_STATE.NONE },
			});
			router.publish(notification);

			expect(handler).not.toHaveBeenCalled();
		});
	});

	describe("publish — material-finding matching", () => {
		it("should match when attention is CRITICAL and risk is R3", () => {
			const store = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(store);
			const handler = vi.fn();
			router.addHandler(handler);

			const executionId = createExecutionId();
			const sub = makeSubscription({
				executionId,
				events: [{ kind: "material-finding" }],
			});
			router.subscribe(sub);

			const notification = makeNotification({
				executionId,
				event: { kind: "attention-changed", to: ATTENTION_STATE.CRITICAL },
				currentState: createOperationalState({
					lifecycle: LIFECYCLE_STATE.RUNNING,
					attention: ATTENTION_STATE.CRITICAL,
					risk: PROJECTED_RISK_TIER.R3,
				}),
			});
			router.publish(notification);

			expect(handler).toHaveBeenCalledTimes(1);
		});

		it("should NOT match when attention is CRITICAL but risk is not R3", () => {
			const store = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(store);
			const handler = vi.fn();
			router.addHandler(handler);

			const executionId = createExecutionId();
			const sub = makeSubscription({
				executionId,
				events: [{ kind: "material-finding" }],
			});
			router.subscribe(sub);

			const notification = makeNotification({
				executionId,
				event: { kind: "attention-changed", to: ATTENTION_STATE.CRITICAL },
				currentState: createOperationalState({
					lifecycle: LIFECYCLE_STATE.RUNNING,
					attention: ATTENTION_STATE.CRITICAL,
					risk: PROJECTED_RISK_TIER.R1,
				}),
			});
			router.publish(notification);

			expect(handler).not.toHaveBeenCalled();
		});
	});

	describe("handler management", () => {
		it("should call all registered handlers", () => {
			const store = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(store);
			const handler1 = vi.fn();
			const handler2 = vi.fn();
			router.addHandler(handler1);
			router.addHandler(handler2);

			const executionId = createExecutionId();
			const sub = makeSubscription({
				executionId,
				events: [{ kind: "any-state-change" }],
			});
			router.subscribe(sub);

			router.publish(makeNotification({ executionId }));

			expect(handler1).toHaveBeenCalledTimes(1);
			expect(handler2).toHaveBeenCalledTimes(1);
		});

		it("should stop calling removed handler", () => {
			const store = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(store);
			const handler1 = vi.fn();
			const handler2 = vi.fn();
			router.addHandler(handler1);
			const id2 = router.addHandler(handler2);
			router.removeHandler(id2);

			const executionId = createExecutionId();
			const sub = makeSubscription({
				executionId,
				events: [{ kind: "any-state-change" }],
			});
			router.subscribe(sub);

			router.publish(makeNotification({ executionId }));

			expect(handler1).toHaveBeenCalledTimes(1);
			expect(handler2).not.toHaveBeenCalled();
		});
	});

	describe("notification field correctness", () => {
		it("should pass notification with correct previousState and currentState", () => {
			const store = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(store);
			const handler = vi.fn();
			router.addHandler(handler);

			const executionId = createExecutionId();
			const sub = makeSubscription({
				executionId,
				events: [{ kind: "any-state-change" }],
			});
			router.subscribe(sub);

			const previous = createOperationalState({
				lifecycle: LIFECYCLE_STATE.RUNNING,
				attention: ATTENTION_STATE.NONE,
			});
			const current = createOperationalState({
				lifecycle: LIFECYCLE_STATE.COMPLETED,
				attention: ATTENTION_STATE.NONE,
			});

			const notification = makeNotification({
				executionId,
				previousState: previous,
				currentState: current,
				event: { kind: "execution-completed" },
			});
			router.publish(notification);

			expect(handler).toHaveBeenCalledTimes(1);
			const calledWith: StateNotification = handler.mock.calls[0]![0]!;
			expect(calledWith.previousState).toEqual(previous);
			expect(calledWith.currentState).toEqual(current);
		});
	});

	describe("multiple subscribers", () => {
		it("should notify all matching subscribers for the same execution", () => {
			const store = new InMemorySubscriptionStore();
			const router = new InMemoryNotificationRouter(store);
			const handler = vi.fn();
			router.addHandler(handler);

			const executionId = createExecutionId();
			const sub1 = makeSubscription({
				executionId,
				subscriptionId: "sub-1",
				events: [{ kind: "any-state-change" }],
			});
			const sub2 = makeSubscription({
				executionId,
				subscriptionId: "sub-2",
				events: [{ kind: "any-state-change" }],
			});
			router.subscribe(sub1);
			router.subscribe(sub2);

			router.publish(makeNotification({ executionId }));

			// Handler is called once per matching subscription
			expect(handler).toHaveBeenCalledTimes(2);
		});
	});
});
