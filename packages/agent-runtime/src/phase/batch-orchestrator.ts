import { getNextPhase } from "./fiscal-phase-graph";
import type { FiscalPhaseOrchestrator } from "./fiscal-phase-orchestrator";
import type { FiscalPhaseStore } from "./fiscal-phase-store";
import type {
	BatchCallbacks,
	BatchConfig,
	BatchEntry,
	BatchEntryStatus,
	BatchStatus,
	FiscalPhaseId,
} from "./types";

/**
 * BatchOrchestrator — manages multiple RUC fiscal periods in parallel.
 *
 * Usage:
 * ```typescript
 * const batch = new BatchOrchestrator(orchestrator, store, {
 *   maxParallel: 5,
 *   autoAdvance: true,
 *   autoAdvanceConfig: { minConfidence: 0.9, blockOnWarnings: false },
 * });
 *
 * await batch.start([
 *   { ruc: "20123456789", periodo: "2026-01" },
 *   { ruc: "20987654321", periodo: "2026-01" },
 * ]);
 *
 * const status = batch.getStatus();
 * console.log(`${status.completed}/${status.total} periods completed`);
 * ```
 */
export class BatchOrchestrator {
	private readonly orchestrator: FiscalPhaseOrchestrator;
	private readonly store: FiscalPhaseStore;
	private readonly config: BatchConfig;
	private readonly callbacks?: BatchCallbacks;
	private readonly entries = new Map<string, BatchEntryStatus>();
	private processing = false;
	private pauseRequested = false;
	private readonly pausedRucs = new Set<string>();
	private startedAt?: Date;
	private runPromise?: Promise<void>;

	constructor(
		orchestrator: FiscalPhaseOrchestrator,
		store: FiscalPhaseStore,
		config?: Partial<BatchConfig>,
		callbacks?: BatchCallbacks,
	) {
		this.orchestrator = orchestrator;
		this.store = store;
		this.config = {
			maxParallel: config?.maxParallel ?? 5,
			autoAdvance: config?.autoAdvance ?? true,
			autoAdvanceConfig: config?.autoAdvanceConfig,
		};
		this.callbacks = callbacks;
	}

	// ─── Public API ──────────────────────────────────────────────

	/**
	 * Start processing a batch of RUCs.
	 * Each RUC+periodo pair is processed independently and in parallel
	 * up to the configured maxParallel limit.
	 */
	async start(entries: BatchEntry[]): Promise<BatchStatus> {
		if (this.processing) {
			throw new Error("Batch is already processing");
		}

		this.processing = true;
		this.pauseRequested = false;
		this.startedAt = new Date();
		this.entries.clear();
		this.pausedRucs.clear();

		// Register all entries
		for (const entry of entries) {
			const key = this.entryKey(entry.ruc, entry.periodo);
			this.entries.set(key, {
				ruc: entry.ruc,
				periodo: entry.periodo,
				status: "not_started",
				currentPhase: "captura",
				startedAt: this.startedAt,
				phasesCompleted: 0,
			});
		}

		// Start processing in background
		this.runPromise = this.processBatch(entries);

		return this.getStatus();
	}

	/**
	 * Get the current aggregate status of the batch.
	 */
	getStatus(): BatchStatus {
		const now = new Date();
		let completed = 0;
		let inProgress = 0;
		let blocked = 0;
		let failed = 0;
		let notStarted = 0;

		const entries: BatchEntryStatus[] = [];

		for (const entry of this.entries.values()) {
			entries.push(entry);
			switch (entry.status) {
				case "completed":
					completed++;
					break;
				case "in_progress":
					inProgress++;
					break;
				case "blocked":
					blocked++;
					break;
				case "failed":
					failed++;
					break;
				case "not_started":
					notStarted++;
					break;
			}
		}

		return {
			total: this.entries.size,
			completed,
			inProgress,
			blocked,
			failed,
			notStarted,
			entries,
			startedAt: this.startedAt ?? now,
			updatedAt: now,
		};
	}

	/**
	 * Pause processing for specific RUCs (or all if empty).
	 * Active phases will complete; no new phases will start for paused RUCs.
	 */
	async pause(rucs?: string[]): Promise<void> {
		if (rucs && rucs.length > 0) {
			for (const ruc of rucs) {
				this.pausedRucs.add(ruc);
			}
		} else {
			this.pauseRequested = true;
		}
	}

	/**
	 * Resume processing for paused RUCs.
	 */
	async resume(rucs?: string[]): Promise<void> {
		if (rucs && rucs.length > 0) {
			for (const ruc of rucs) {
				this.pausedRucs.delete(ruc);
			}
		} else {
			this.pauseRequested = false;
		}
	}

	/**
	 * Wait for the batch to complete.
	 * Returns the final status.
	 */
	async waitForCompletion(): Promise<BatchStatus> {
		if (this.runPromise) {
			await this.runPromise;
		}
		return this.getStatus();
	}

	/**
	 * Check if the batch is still processing.
	 */
	isProcessing(): boolean {
		return this.processing;
	}

	// ─── Internal Processing ─────────────────────────────────────

	private async processBatch(entries: BatchEntry[]): Promise<void> {
		const queue = [...entries];
		const active = new Set<string>();

		const processNext = async (): Promise<void> => {
			while (queue.length > 0 && !this.pauseRequested) {
				const entry = queue.shift();
				if (entry === undefined) break;
				const key = this.entryKey(entry.ruc, entry.periodo);
				active.add(key);

				try {
					await this.processSingleEntry(entry);
				} catch (error) {
					await this.handleEntryError(
						entry,
						error instanceof Error ? error.message : "Unknown error",
					);
				} finally {
					active.delete(key);
				}
			}
		};

		// Start up to maxParallel concurrent processors
		const workers: Promise<void>[] = [];
		const workerCount = Math.min(this.config.maxParallel, queue.length);

		for (let i = 0; i < workerCount; i++) {
			workers.push(processNext());
		}

		await Promise.all(workers);

		// Process any remaining entries (shouldn't happen with the while loop above)
		for (const entry of queue) {
			const key = this.entryKey(entry.ruc, entry.periodo);
			active.add(key);
			try {
				await this.processSingleEntry(entry);
			} catch (error) {
				await this.handleEntryError(
					entry,
					error instanceof Error ? error.message : "Unknown error",
				);
			} finally {
				active.delete(key);
			}
		}

		this.processing = false;
	}

	private async processSingleEntry(entry: BatchEntry): Promise<void> {
		const key = this.entryKey(entry.ruc, entry.periodo);
		const currentEntry = this.entries.get(key);
		if (!currentEntry) return;

		// Check if paused
		if (this.isPaused(entry)) {
			currentEntry.status = "not_started";
			return;
		}

		currentEntry.status = "in_progress";
		currentEntry.currentPhase = "captura";

		const startResult = await this.orchestrator.startPeriod(
			entry.ruc,
			entry.periodo,
		);
		if (
			!startResult.success &&
			!startResult.error?.includes("already exists")
		) {
			await this.handleEntryError(
				entry,
				startResult.error ?? "Failed to start period",
			);
			return;
		}

		const outcome = await this.runPhases(entry, currentEntry);
		if (outcome.stopped) return;

		if (outcome.completed || outcome.lastPhase === "auditoria") {
			await this.finalizeEntry(entry, currentEntry);
		}
	}

	private isPaused(entry: BatchEntry): boolean {
		return this.pauseRequested || this.pausedRucs.has(entry.ruc);
	}

	/**
	 * Run phases sequentially with auto-advance. `stopped` means a phase was
	 * blocked/failed (the entry and callbacks are already updated).
	 */
	private async runPhases(
		entry: BatchEntry,
		currentEntry: BatchEntryStatus,
	): Promise<{
		stopped: boolean;
		completed: boolean;
		lastPhase: FiscalPhaseId;
	}> {
		let currentPhase: FiscalPhaseId = "captura";
		let completed = false;

		while (!completed && !this.isPaused(entry)) {
			currentEntry.currentPhase = currentPhase;

			if (!(await this.startPhaseOrStop(entry, currentEntry, currentPhase))) {
				return { stopped: true, completed, lastPhase: currentPhase };
			}
			if (
				!(await this.completePhaseOrStop(entry, currentEntry, currentPhase))
			) {
				return { stopped: true, completed, lastPhase: currentPhase };
			}

			currentEntry.phasesCompleted++;
			await this.notifyPhaseComplete(entry, currentPhase);

			const next = getNextPhase(currentPhase);
			if (!next) {
				completed = true;
			} else {
				currentPhase = next;
			}
		}
		return { stopped: false, completed, lastPhase: currentPhase };
	}

	/** Start the phase (evaluates entry gates). Returns false when the entry must stop. */
	private async startPhaseOrStop(
		entry: BatchEntry,
		currentEntry: BatchEntryStatus,
		phase: FiscalPhaseId,
	): Promise<boolean> {
		const phaseStart = await this.orchestrator.startPhase(
			entry.ruc,
			entry.periodo,
			phase,
		);
		if (phaseStart.success) return true;

		currentEntry.lastError = phaseStart.error;
		if (phaseStart.status === "blocked") {
			currentEntry.status = "blocked";
			await this.callbacks?.onPhaseBlocked?.(
				entry.ruc,
				entry.periodo,
				phase,
				phaseStart.gateResult?.blockers ?? [],
			);
		} else {
			currentEntry.status = "failed";
			await this.callbacks?.onError?.(
				entry.ruc,
				entry.periodo,
				phase,
				phaseStart.error ?? "Phase start failed",
			);
		}
		return false;
	}

	/**
	 * Run the phase agent (simulated in auto-advance mode) and complete it
	 * (evaluates exit gates, auto-advances). Returns false when the entry must stop.
	 */
	private async completePhaseOrStop(
		entry: BatchEntry,
		currentEntry: BatchEntryStatus,
		phase: FiscalPhaseId,
	): Promise<boolean> {
		// In a real scenario this is where the actual phase agent (OCR,
		// classification, etc.) would run; auto-advance simulates success.
		const agentOutput = {
			phaseId: phase,
			ruc: entry.ruc,
			periodo: entry.periodo,
			success: true,
			summary: `Auto-processed ${phase} for ${entry.ruc}/${entry.periodo}`,
			data: {},
		};
		const completeResult = await this.orchestrator.completePhase(
			entry.ruc,
			entry.periodo,
			phase,
			agentOutput,
			{ autoAdvance: this.config.autoAdvance },
		);
		if (completeResult.success) return true;

		// Phase blocked or failed
		const periodState = await this.store.getPeriodState(
			entry.ruc,
			entry.periodo,
		);
		currentEntry.status =
			(periodState?.status ?? "failed") === "blocked" ? "blocked" : "failed";
		currentEntry.lastError = completeResult.error;

		await this.callbacks?.onPhaseBlocked?.(
			entry.ruc,
			entry.periodo,
			phase,
			completeResult.gateResult?.blockers ?? [],
		);
		return false;
	}

	private async notifyPhaseComplete(
		entry: BatchEntry,
		phase: FiscalPhaseId,
	): Promise<void> {
		if (!this.callbacks?.onPhaseComplete) return;
		const periodState = await this.store.getPeriodState(
			entry.ruc,
			entry.periodo,
		);
		// Behavior preserved from the previous non-null assertion: the store is
		// expected to hold the state after a phase completes.
		await this.callbacks.onPhaseComplete(
			entry.ruc,
			entry.periodo,
			phase,
			periodState as NonNullable<typeof periodState>,
		);
	}

	/** Check we actually reached the end of the cycle and mark the entry accordingly. */
	private async finalizeEntry(
		entry: BatchEntry,
		currentEntry: BatchEntryStatus,
	): Promise<void> {
		const finalState = await this.store.getPeriodState(
			entry.ruc,
			entry.periodo,
		);
		if (
			finalState?.currentPhase === "auditoria" &&
			finalState.status === "completed"
		) {
			currentEntry.status = "completed";
			currentEntry.completedAt = finalState.updatedAt;
			await this.callbacks?.onPeriodComplete?.(
				entry.ruc,
				entry.periodo,
				finalState,
			);
		} else {
			currentEntry.status = "in_progress";
		}
	}

	private async handleEntryError(
		entry: BatchEntry,
		error: string,
	): Promise<void> {
		const key = this.entryKey(entry.ruc, entry.periodo);
		const currentEntry = this.entries.get(key);
		if (currentEntry) {
			currentEntry.status = "failed";
			currentEntry.lastError = error;
		}

		await this.callbacks?.onError?.(
			entry.ruc,
			entry.periodo,
			entry.periodo as unknown as FiscalPhaseId,
			error,
		);
	}

	private entryKey(ruc: string, periodo: string): string {
		return `${ruc}:${periodo}`;
	}
}
