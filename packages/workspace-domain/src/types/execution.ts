// ─── Branded Types ──────────────────────────────────────────────────────────

export type ExecutionId = string & { readonly __brand: "ExecutionId" };

/**
 * Public factory: creates a new ExecutionId.
 * The execution ID is the canonical identity of a work unit.
 * It MUST survive changes to Pi session, provider, or workflow engine.
 */
export function createExecutionId(): ExecutionId {
	if (typeof crypto !== "undefined" && crypto.randomUUID) {
		return crypto.randomUUID() as ExecutionId;
	}
	return `exec-${Date.now()}-${Math.random().toString(36).slice(2, 11)}` as ExecutionId;
}

// ─── ExecutionReference ─────────────────────────────────────────────────────

/**
 * Canonical, runtime-neutral execution identity.
 * The executionId is the ONLY stable identifier.
 * All runtime bindings (Pi sessions, workflow engine refs) are replaceable metadata.
 */
export interface ExecutionReference {
	readonly executionId: ExecutionId;
	readonly lastAuthoritativeSequence: number;
}

// ─── ExecutionRuntimeBinding ─────────────────────────────────────────────────

/**
 * Replaceable runtime binding metadata.
 * When a Pi session expires or a workflow engine changes,
 * this binding is updated — the ExecutionReference stays the same.
 */
export interface ExecutionRuntimeBinding {
	readonly executionId: ExecutionId;
	readonly runtime: "pi" | "workflow" | "worker" | "connector";
	readonly runtimeReference: string;
	readonly bindingVersion: number;
}

// ─── Factory ────────────────────────────────────────────────────────────────

export function createExecutionReference(): ExecutionReference {
	return {
		executionId: createExecutionId(),
		lastAuthoritativeSequence: 0,
	};
}

export function createExecutionRuntimeBinding(
	executionId: ExecutionId,
	runtime: ExecutionRuntimeBinding["runtime"],
	runtimeReference: string,
): ExecutionRuntimeBinding {
	return {
		executionId,
		runtime,
		runtimeReference,
		bindingVersion: 1,
	};
}
