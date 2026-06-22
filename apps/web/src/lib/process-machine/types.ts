/**
 * @fileoverview Types and interfaces for the XState process machine factory.
 *
 * @see createProcessMachine for the factory function
 */

/**
 * All possible states the process machine can be in.
 *
 * - `"idle"` — initial state, waiting for a `PROCESS` event
 * - `"processing"` — async operation in progress
 * - `"analyzing"` — optional second async step (only when `onAnalyze` is configured)
 * - `"resolved"` — successful completion
 * - `"error"` — failure, allows `RETRY` or `RESET`
 */
export type ProcessStatus = "idle" | "processing" | "analyzing" | "resolved" | "error";

/**
 * Minimum context shape each process machine must implement.
 *
 * @example
 * ```ts
 * interface MyContext extends ProcessBaseContext {
 *   items: Item[]
 * }
 * ```
 */
export interface ProcessBaseContext {
	/** Current error message; `null` when no error has occurred */
	error: string | null;
}

/**
 * Configuration for building a process machine via {@link createProcessMachine}.
 *
 * @typeParam TContext - The extended context type (must extend `ProcessBaseContext`)
 */
export interface ProcessMachineConfig<TContext extends ProcessBaseContext> {
	/** Unique machine identifier (passed to `createMachine(id)`) */
	id: string;
	/** Initial state (default: `"idle"`) */
	initial?: ProcessStatus;
	/** Initial context snapshot — deep-cloned on reset */
	context: TContext;
	/** Custom guard functions keyed by name (XState `guards` option) */
	guards?: Record<string, (...args: unknown[]) => unknown>;
	/** Custom action functions keyed by name (XState `actions` option) */
	actions?: Record<string, (...args: unknown[]) => unknown>;
	/**
	 * Async processing function (declarative mode).
	 * Receives the current context and returns a partial context merge.
	 * When omitted, the machine runs in **manual mode** and waits for
	 * `RESOLVE` / `FAIL` events.
	 */
	onProcess?: (context: TContext) => Promise<Partial<TContext>>;
	/**
	 * Optional second async step that runs after `onProcess` succeeds.
	 * Only used when `onProcess` is also provided. When omitted,
	 * the machine goes directly from `processing` to `resolved`.
	 */
	onAnalyze?: (context: TContext) => Promise<Partial<TContext>>;
	/**
	 * Override transitions and entry/exit actions for built-in states.
	 * Keys are state names; `on` merges transitions into the existing state.
	 */
	states?: Partial<
		Record<
			ProcessStatus,
			{
				on?: Record<string, unknown>;
				entry?: unknown[];
				exit?: unknown[];
			}
		>
	>;
	/** Additional states beyond the built-in set (e.g. custom wizard steps) */
	extraStates?: Record<string, unknown>;
}
