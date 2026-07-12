/**
 * @fileoverview XState process machine factory.
 *
 * Creates state machines for async workflows with states:
 * `idle` → `processing` → (`analyzing` →) `resolved` | `error`
 *
 * **Design philosophy:**
 * - Two modes: **declarative** (caller provides `onProcess`/`onAnalyze` promises)
 *   and **manual** (caller sends `RESOLVE`/`FAIL` events directly)
 * - The `analyzing` state is an optional second step after processing completes
 * - Context is deep-cloned at initialisation so `RESET` returns to a pristine copy
 * - State overrides allow extending any built-in state with extra transitions
 * - `extraStates` support adding completely custom states (e.g. for stepper UIs)
 *
 * **Error handling:**
 * - Automatic transition to `error` state on promise rejection
 * - Error message captured from `Error.message` or a static fallback
 * - `RETRY` goes back to `processing`; `RESET` returns to `idle`
 *
 * @see {@link createProcessMachine} for the factory
 */

import { assign, createMachine, fromPromise } from "xstate";
import type { ProcessMachineConfig } from "./types";

type ProcessEvent =
	| { type: "PROCESS" }
	| { type: "RESOLVE" }
	| { type: "FAIL"; error: string }
	| { type: "RETRY" }
	| { type: "RESET" };

/**
 * Creates an XState process machine with a standard lifecycle.
 *
 * **Declarative mode** (with `onProcess`):
 * ```text
 * idle → PROCESS → processing → (analyzing →) resolved
 *                         ↓
 *                       error ← FAIL
 * ```
 * On error, send `RETRY` to re-run processing, or `RESET` to go back to idle.
 *
 * **Manual mode** (without `onProcess`):
 * ```text
 * idle → PROCESS → processing → RESOLVE → resolved
 *                         ↓
 *                       error ← FAIL
 * ```
 * Caller must manually dispatch `RESOLVE` or `FAIL` from the `processing` state.
 *
 * @typeParam TContext - Extended context (must extend `ProcessBaseContext`)
 * @param config - Machine configuration
 * @returns An XState `StateMachine` instance with states `idle | processing | analyzing | resolved | error`,
 *   and events `PROCESS | RESOLVE | FAIL | RETRY | RESET`
 *
 * @example
 * ```ts
 * // Declarative mode
 * const machine = createProcessMachine({
 *   id: "data-import",
 *   context: { error: null, rows: [] },
 *   onProcess: async (ctx) => {
 *     const result = await processRows(ctx.rows)
 *     return { processed: result.count }
 *   },
 * })
 * ```
 *
 * @example
 * ```ts
 * // Manual mode with state overrides
 * const machine = createProcessMachine({
 *   id: "manual-workflow",
 *   context: { error: null },
 *   states: {
 *     error: { on: { CUSTOM_EVENT: { target: "idle" } } },
 *   },
 * })
 * ```
 *
 * @see {@link ProcessMachineConfig} for the full configuration options
 */
export function createProcessMachine<TContext extends { error: string | null }>(
	config: ProcessMachineConfig<TContext>,
) {
	const {
		id,
		initial = "idle",
		onProcess,
		onAnalyze,
		states: stateOverrides,
		extraStates,
	} = config;

	const pristineContext = structuredClone(config.context) as TContext;
	const initialContext = structuredClone(config.context) as TContext;
	const hasProcess = !!onProcess;
	const hasAnalyze = !!onAnalyze && hasProcess;

	const machineConfig = {
		id,
		initial,
		types: {} as {
			context: TContext;
			events: ProcessEvent;
		},
		context: initialContext,
		states: {
			idle: {
				on: {
					PROCESS: { target: "processing" as const },
					...(stateOverrides?.idle?.on ?? {}),
				},
			},
			analyzing: {
				always: { target: "resolved" as const },
			},
			resolved: {
				on: {
					PROCESS: { target: "processing" as const },
					RESET: {
						target: "idle" as const,
						actions: "resetContext" as const,
					},
					...(stateOverrides?.resolved?.on ?? {}),
				},
			},
			error: {
				on: {
					RETRY: { target: "processing" as const },
					RESET: {
						target: "idle" as const,
						actions: "resetContext" as const,
					},
					...(stateOverrides?.error?.on ?? {}),
				},
			},
			...extraStates,
		},
	};

	if (hasProcess) {
		const processActor = fromPromise<Partial<TContext>, TContext>(({ input }) =>
			onProcess?.(input),
		);

		(machineConfig.states as Record<string, unknown>).processing = {
			invoke: {
				src: processActor,
				input: ({ context }: { context: TContext }) => context,
				onDone: {
					target: hasAnalyze ? "analyzing" : "resolved",
					actions: assign(
						({
							context,
							event,
						}: {
							context: TContext;
							event: { output: Partial<TContext> };
						}) => ({
							...context,
							...event.output,
							error: null,
						}),
					),
				},
				onError: {
					target: "error",
					actions: assign({
						error: ({ event }: { event: { error: unknown } }) =>
							(event.error as Error)?.message ?? "Process failed",
					}),
				},
			},
		} as Parameters<typeof createMachine>[0]["states"];

		if (hasAnalyze) {
			const analyzeActor = fromPromise<Partial<TContext>, TContext>(
				({ input }) => onAnalyze?.(input),
			);

			(machineConfig.states as Record<string, unknown>).analyzing = {
				invoke: {
					src: analyzeActor,
					input: ({ context }: { context: TContext }) => context,
					onDone: {
						target: "resolved",
						actions: assign(
							({
								context,
								event,
							}: {
								context: TContext;
								event: { output: Partial<TContext> };
							}) => ({
								...context,
								...event.output,
								error: null,
							}),
						),
					},
					onError: {
						target: "error",
						actions: assign({
							error: ({ event }: { event: { error: unknown } }) =>
								(event.error as Error)?.message ?? "Analysis failed",
						}),
					},
				},
			} as Parameters<typeof createMachine>[0]["states"];
		}

		return createMachine(
			machineConfig as Parameters<typeof createMachine>[0],
			{
				actions: {
					resetContext: assign(
						() => structuredClone(pristineContext) as TContext,
					),
				},
			} as Parameters<typeof createMachine>[1],
		);
	}

	(machineConfig.states as Record<string, unknown>).processing = {
		on: {
			RESOLVE: { target: "resolved" },
			FAIL: {
				target: "error",
				actions: assign({
					error: ({ event }: { event: { error: string } }) => event.error,
				}),
			},
		},
	};

	return createMachine(
		machineConfig as Parameters<typeof createMachine>[0],
		{
			actions: {
				resetContext: assign(
					() => structuredClone(pristineContext) as TContext,
				),
			},
		} as Parameters<typeof createMachine>[1],
	);
}
