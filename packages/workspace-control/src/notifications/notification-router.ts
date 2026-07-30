// ─── Notification Router ────────────────────────────────────────────────────

import {
	ATTENTION_STATE,
	PROJECTED_RISK_TIER,
} from "@drenyra/workspace-domain";
import type {
	ExecutionSubscription,
	StateNotification,
	SubscriptionEvent,
} from "./types";
import type { SubscriptionStore } from "./subscription";

// ─── Types ──────────────────────────────────────────────────────────────────

export type NotificationHandler = (notification: StateNotification) => void;

// ─── Interface ──────────────────────────────────────────────────────────────

export interface NotificationRouter {
	subscribe(subscription: ExecutionSubscription): string;
	unsubscribe(subscriptionId: string): boolean;
	publish(notification: StateNotification): void;
	addHandler(handler: NotificationHandler): string;
	removeHandler(handlerId: string): boolean;
}

// ─── In-Memory Implementation ───────────────────────────────────────────────

export class InMemoryNotificationRouter implements NotificationRouter {
	private handlers: Map<string, NotificationHandler> = new Map();

	constructor(private readonly store: SubscriptionStore) {}

	subscribe(subscription: ExecutionSubscription): string {
		this.store.add(subscription);
		return subscription.subscriptionId;
	}

	unsubscribe(subscriptionId: string): boolean {
		return this.store.remove(subscriptionId);
	}

	publish(notification: StateNotification): void {
		const subscriptions = this.store.getByExecution(notification.executionId);

		for (const sub of subscriptions) {
			if (this.matches(sub.events, notification)) {
				for (const handler of this.handlers.values()) {
					handler(notification);
				}
			}
		}
	}

	addHandler(handler: NotificationHandler): string {
		const id = crypto.randomUUID();
		this.handlers.set(id, handler);
		return id;
	}

	removeHandler(handlerId: string): boolean {
		return this.handlers.delete(handlerId);
	}

	// ─── Matching Logic ─────────────────────────────────────────────────────

	private matches(
		events: readonly SubscriptionEvent[],
		notification: StateNotification,
	): boolean {
		for (const event of events) {
			if (this.eventMatches(event, notification)) {
				return true;
			}
		}
		return false;
	}

	private eventMatches(
		subscriptionEvent: SubscriptionEvent,
		notification: StateNotification,
	): boolean {
		const notifEvent = notification.event;

		switch (subscriptionEvent.kind) {
			case "any-state-change":
				return true;

			case "lifecycle-changed":
				if (notifEvent.kind !== "lifecycle-changed") return false;
				if (
					subscriptionEvent.from !== undefined &&
					notifEvent.from !== subscriptionEvent.from
				)
					return false;
				return notifEvent.to === subscriptionEvent.to;

			case "attention-changed":
				if (notifEvent.kind !== "attention-changed") return false;
				return notifEvent.to === subscriptionEvent.to;

			case "execution-completed":
				return notifEvent.kind === "execution-completed";

			case "execution-blocked":
				return (
					notifEvent.kind === "attention-changed" &&
					notifEvent.to === ATTENTION_STATE.BLOCKED
				);

			case "execution-waiting-approval":
				return (
					notifEvent.kind === "attention-changed" &&
					notifEvent.to === ATTENTION_STATE.APPROVAL_REQUIRED
				);

			case "material-finding":
				return (
					notifEvent.kind === "attention-changed" &&
					notifEvent.to === ATTENTION_STATE.CRITICAL &&
					notification.currentState.risk === PROJECTED_RISK_TIER.R3
				);

			default: {
				// Exhaustiveness check
				const _exhaustive: never = subscriptionEvent;
				return _exhaustive;
			}
		}
	}
}
