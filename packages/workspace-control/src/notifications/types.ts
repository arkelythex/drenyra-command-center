// ─── Notification Types ─────────────────────────────────────────────────────

import type {
	ExecutionId,
	OperationalState,
	LifecycleState,
	AttentionState,
} from "@drenyra/workspace-domain";

// ─── SubscriptionEvent ─────────────────────────────────────────────────────

export type SubscriptionEvent =
	| {
			readonly kind: "lifecycle-changed";
			readonly from?: LifecycleState;
			readonly to: LifecycleState;
	  }
	| { readonly kind: "attention-changed"; readonly to: AttentionState }
	| { readonly kind: "execution-completed" }
	| { readonly kind: "execution-blocked" }
	| { readonly kind: "execution-waiting-approval" }
	| { readonly kind: "any-state-change" }
	| { readonly kind: "material-finding" };

// ─── ExecutionSubscription ─────────────────────────────────────────────────

export interface ExecutionSubscription {
	readonly subscriptionId: string;
	readonly executionId: ExecutionId;
	readonly subscriberId: string;
	readonly events: readonly SubscriptionEvent[];
	readonly createdAt: string; // ISO 8601
}

// ─── StateNotification ─────────────────────────────────────────────────────

export interface StateNotification {
	readonly notificationId: string;
	readonly subscriptionId: string;
	readonly executionId: ExecutionId;
	readonly event: SubscriptionEvent;
	readonly previousState: OperationalState;
	readonly currentState: OperationalState;
	readonly timestamp: string; // ISO 8601
}

// ─── WaitResult ────────────────────────────────────────────────────────────

export interface WaitResult {
	readonly executionId: ExecutionId;
	readonly event: SubscriptionEvent;
	readonly finalState: OperationalState;
	readonly waitedMs: number;
}

// ─── WaitOptions ───────────────────────────────────────────────────────────

export interface WaitOptions {
	readonly executionId: ExecutionId;
	readonly subscription: SubscriptionEvent;
	readonly timeoutMs?: number; // default: 30000 (30 seconds)
	readonly pollIntervalMs?: number; // default: 100
}
