// ─── Subscription Store ─────────────────────────────────────────────────────

import type { ExecutionId } from "@drenyra/workspace-domain";
import type { ExecutionSubscription } from "./types";

// ─── Interface ──────────────────────────────────────────────────────────────

export interface SubscriptionStore {
	add(subscription: ExecutionSubscription): void;
	remove(subscriptionId: string): boolean;
	get(subscriptionId: string): ExecutionSubscription | null;
	getByExecution(executionId: ExecutionId): ExecutionSubscription[];
	getBySubscriber(subscriberId: string): ExecutionSubscription[];
	getAll(): ExecutionSubscription[];
}

// ─── In-Memory Implementation ───────────────────────────────────────────────

export class InMemorySubscriptionStore implements SubscriptionStore {
	private subscriptions: Map<string, ExecutionSubscription> = new Map();

	add(subscription: ExecutionSubscription): void {
		this.subscriptions.set(subscription.subscriptionId, subscription);
	}

	remove(subscriptionId: string): boolean {
		return this.subscriptions.delete(subscriptionId);
	}

	get(subscriptionId: string): ExecutionSubscription | null {
		return this.subscriptions.get(subscriptionId) ?? null;
	}

	getByExecution(executionId: ExecutionId): ExecutionSubscription[] {
		const result: ExecutionSubscription[] = [];
		for (const sub of this.subscriptions.values()) {
			if (sub.executionId === executionId) {
				result.push(sub);
			}
		}
		return result;
	}

	getBySubscriber(subscriberId: string): ExecutionSubscription[] {
		const result: ExecutionSubscription[] = [];
		for (const sub of this.subscriptions.values()) {
			if (sub.subscriberId === subscriberId) {
				result.push(sub);
			}
		}
		return result;
	}

	getAll(): ExecutionSubscription[] {
		return [...this.subscriptions.values()];
	}
}
