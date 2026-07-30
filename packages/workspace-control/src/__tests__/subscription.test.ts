import { describe, it, expect } from "vitest";
import { createExecutionId } from "@drenyra/workspace-domain";
import type { ExecutionSubscription } from "../notifications/types";
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

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("InMemorySubscriptionStore", () => {
	describe("add and get", () => {
		it("should return the subscription by ID after adding", () => {
			const store = new InMemorySubscriptionStore();
			const sub = makeSubscription();

			store.add(sub);

			const retrieved = store.get(sub.subscriptionId);
			expect(retrieved).toBe(sub);
		});

		it("should return null for non-existent subscription ID", () => {
			const store = new InMemorySubscriptionStore();

			const retrieved = store.get("non-existent-id");
			expect(retrieved).toBeNull();
		});

		it("should find subscriptions by executionId", () => {
			const store = new InMemorySubscriptionStore();
			const executionId = createExecutionId();
			const sub1 = makeSubscription({ executionId, subscriptionId: "sub-1" });
			const sub2 = makeSubscription({ executionId, subscriptionId: "sub-2" });
			const sub3 = makeSubscription({ subscriptionId: "sub-3" }); // different execution

			store.add(sub1);
			store.add(sub2);
			store.add(sub3);

			const byExec = store.getByExecution(executionId);
			expect(byExec).toHaveLength(2);
			expect(byExec).toContain(sub1);
			expect(byExec).toContain(sub2);
		});

		it("should find subscriptions by subscriberId", () => {
			const store = new InMemorySubscriptionStore();
			const sub1 = makeSubscription({
				subscriberId: "alice",
				subscriptionId: "sub-1",
			});
			const sub2 = makeSubscription({
				subscriberId: "alice",
				subscriptionId: "sub-2",
			});
			const sub3 = makeSubscription({
				subscriberId: "bob",
				subscriptionId: "sub-3",
			});

			store.add(sub1);
			store.add(sub2);
			store.add(sub3);

			const bySubscriber = store.getBySubscriber("alice");
			expect(bySubscriber).toHaveLength(2);
			expect(bySubscriber).toContain(sub1);
			expect(bySubscriber).toContain(sub2);
		});
	});

	describe("remove", () => {
		it("should return true and remove existing subscription", () => {
			const store = new InMemorySubscriptionStore();
			const sub = makeSubscription();

			store.add(sub);

			const removed = store.remove(sub.subscriptionId);
			expect(removed).toBe(true);
			expect(store.get(sub.subscriptionId)).toBeNull();
		});

		it("should return false when removing non-existent subscription", () => {
			const store = new InMemorySubscriptionStore();

			const removed = store.remove("non-existent-id");
			expect(removed).toBe(false);
		});
	});

	describe("getAll", () => {
		it("should return all subscriptions", () => {
			const store = new InMemorySubscriptionStore();
			const sub1 = makeSubscription({ subscriptionId: "sub-1" });
			const sub2 = makeSubscription({ subscriptionId: "sub-2" });

			store.add(sub1);
			store.add(sub2);

			const all = store.getAll();
			expect(all).toHaveLength(2);
			expect(all).toContain(sub1);
			expect(all).toContain(sub2);
		});

		it("should return empty array when store is empty", () => {
			const store = new InMemorySubscriptionStore();

			const all = store.getAll();
			expect(all).toEqual([]);
		});
	});

	describe("edge cases", () => {
		it("should return empty array for executionId with no subscriptions", () => {
			const store = new InMemorySubscriptionStore();
			const executionId = createExecutionId();

			const byExec = store.getByExecution(executionId);
			expect(byExec).toEqual([]);
		});

		it("should return empty array for subscriberId with no subscriptions", () => {
			const store = new InMemorySubscriptionStore();

			const bySubscriber = store.getBySubscriber("no-one");
			expect(bySubscriber).toEqual([]);
		});
	});
});
