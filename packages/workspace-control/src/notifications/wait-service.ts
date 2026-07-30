// ─── Wait Service ────────────────────────────────────────────────────────────

import type {
	ExecutionId,
	OperationalState,
	LifecycleState,
	AttentionState,
} from "@drenyra/workspace-domain";
import { isTerminal, ATTENTION_STATE } from "@drenyra/workspace-domain";
import type { EventStore } from "@drenyra/workspace-projections";
import { buildExecutionProjection } from "@drenyra/workspace-projections";
import type { NotificationRouter } from "./notification-router";
import type { SubscriptionEvent, WaitResult } from "./types";
import { WaitTimeoutError } from "./errors";

// ─── Defaults ───────────────────────────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_POLL_INTERVAL_MS = 100;

// ─── WaitService ────────────────────────────────────────────────────────────

export class WaitService {
	constructor(
		private readonly eventStore: EventStore,
		private readonly router: NotificationRouter,
	) {}

	waitUntil(
		executionId: ExecutionId,
		targetLifecycle: LifecycleState,
		timeoutMs?: number,
	): Promise<WaitResult> {
		const subscription: SubscriptionEvent = {
			kind: "lifecycle-changed",
			to: targetLifecycle,
		};

		return this.poll(executionId, subscription, {
			executionId,
			subscription,
			timeoutMs,
			condition: (state) => state.lifecycle === targetLifecycle,
		});
	}

	waitUntilBlocked(
		executionId: ExecutionId,
		timeoutMs?: number,
	): Promise<WaitResult> {
		const subscription: SubscriptionEvent = { kind: "execution-blocked" };

		return this.poll(executionId, subscription, {
			executionId,
			subscription,
			timeoutMs,
			condition: (state) => state.attention === ATTENTION_STATE.BLOCKED,
		});
	}

	waitUntilApprovalRequired(
		executionId: ExecutionId,
		timeoutMs?: number,
	): Promise<WaitResult> {
		const subscription: SubscriptionEvent = {
			kind: "execution-waiting-approval",
		};

		return this.poll(executionId, subscription, {
			executionId,
			subscription,
			timeoutMs,
			condition: (state) =>
				state.attention === ATTENTION_STATE.APPROVAL_REQUIRED,
		});
	}

	waitUntilCompleted(
		executionId: ExecutionId,
		timeoutMs?: number,
	): Promise<WaitResult> {
		const subscription: SubscriptionEvent = { kind: "execution-completed" };

		return this.poll(executionId, subscription, {
			executionId,
			subscription,
			timeoutMs,
			condition: (state) => isTerminal(state),
		});
	}

	waitForAttention(
		executionId: ExecutionId,
		targetAttention: AttentionState,
		timeoutMs?: number,
	): Promise<WaitResult> {
		const subscription: SubscriptionEvent = {
			kind: "attention-changed",
			to: targetAttention,
		};

		return this.poll(executionId, subscription, {
			executionId,
			subscription,
			timeoutMs,
			condition: (state) => state.attention === targetAttention,
		});
	}

	// ─── Private: Polling Engine ────────────────────────────────────────────

	private poll(
		executionId: ExecutionId,
		subscriptionEvent: SubscriptionEvent,
		options: {
			executionId: ExecutionId;
			subscription: SubscriptionEvent;
			timeoutMs: number | undefined;
			condition: (state: OperationalState) => boolean;
		},
	): Promise<WaitResult> {
		const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
		const pollIntervalMs = DEFAULT_POLL_INTERVAL_MS;
		const startTime = Date.now();

		return new Promise<WaitResult>((resolve, reject) => {
			// Fast path: check condition immediately
			const currentState = this.getCurrentState(executionId);
			if (options.condition(currentState)) {
				const waitedMs = Date.now() - startTime;
				resolve({
					executionId,
					event: subscriptionEvent,
					finalState: currentState,
					waitedMs,
				});
				return;
			}

			// Register subscription
			const subscriptionId = crypto.randomUUID();
			this.router.subscribe({
				subscriptionId,
				executionId,
				subscriberId: "wait-service",
				events: [subscriptionEvent],
				createdAt: new Date().toISOString(),
			});

			const interval = setInterval(() => {
				const state = this.getCurrentState(executionId);

				if (options.condition(state)) {
					clearInterval(interval);
					this.router.unsubscribe(subscriptionId);

					const waitedMs = Date.now() - startTime;
					resolve({
						executionId,
						event: subscriptionEvent,
						finalState: state,
						waitedMs,
					});
					return;
				}

				const elapsed = Date.now() - startTime;
				if (elapsed >= timeoutMs) {
					clearInterval(interval);
					this.router.unsubscribe(subscriptionId);

					reject(new WaitTimeoutError(executionId, timeoutMs));
				}
			}, pollIntervalMs);
		});
	}

	private getCurrentState(executionId: ExecutionId): OperationalState {
		const events = this.eventStore.getEvents(executionId);
		const projection = buildExecutionProjection(executionId, events);
		return projection.current;
	}
}
