// ─── Concurrency Types ──────────────────────────────────────────────────────

// Conflict detected between two concurrent operations
export interface ConflictEvent {
	readonly resourceId: string;
	readonly resourceType: "workspace" | "layout" | "execution" | "view";
	readonly expectedRevision: number;
	readonly actualRevision: number;
	readonly conflictingClientId?: string;
	readonly timestamp: string;
}

// Conflict resolution strategies
export const CONFLICT_RESOLUTION_STRATEGY = {
	CLIENT_WINS: "client-wins",
	SERVER_WINS: "server-wins",
	MERGE_AVAILABLE: "merge-available",
	NOTIFY_ONLY: "notify-only",
} as const;

export type ConflictResolutionStrategy =
	(typeof CONFLICT_RESOLUTION_STRATEGY)[keyof typeof CONFLICT_RESOLUTION_STRATEGY];

// Operation lock
export interface OperationLock {
	readonly resourceId: string;
	readonly clientId: string;
	readonly acquiredAt: string;
	readonly ttlMs: number;
}

// Lock acquisition result
export type LockResult =
	| { readonly kind: "acquired"; readonly lock: OperationLock }
	| {
			readonly kind: "conflict";
			readonly holder: string;
			readonly remainingTtlMs: number;
	  }
	| { readonly kind: "expired" };
