/**
 * AsyncBarrier — Barrera sincronizada para pruebas concurrentes.
 *
 * Permite coordinar múltiples actores (conexiones PG independientes,
 * workers, relays) para que todos lleguen a un punto antes de continuar.
 *
 * Diseño:
 *   - Determinista: arrive() + wait() o arriveAndWait().
 *   - Liberación explícita: todos los actores continúan simultáneamente.
 *   - Reutilizable: reset() permite reusar entre tests.
 *   - Timeout configurable para evitar hangs.
 */

// ─── Fast async barrier using promises ──────────────────────────────────────

export class AsyncBarrier {
	private readonly partySize: number;
	private readonly timeoutMs: number;
	private arrived = 0;
	private readyResolve: (() => void) | null = null;
	private readyPromise: Promise<void> | null = null;
	private timedOut = false;
	private _released = false;

	/**
	 * @param partySize Número de actores que deben llegar antes de liberar.
	 * @param timeoutMs Timeout en ms (default 5000). 0 = sin timeout.
	 */
	constructor(partySize: number, timeoutMs = 5_000) {
		if (partySize < 1) throw new Error("AsyncBarrier: partySize must be >= 1");
		this.partySize = partySize;
		this.timeoutMs = timeoutMs;
		this.readyPromise = new Promise((resolve) => {
			this.readyResolve = resolve;
		});
	}

	/**
	 * Llegar a la barrera y esperar a que todos lleguen.
	 */
	async arriveAndWait(): Promise<void> {
		this.arrived++;
		if (this.arrived >= this.partySize) {
			this._released = true;
			this.readyResolve?.();
			return;
		}

		if (!this.readyPromise) return;

		if (this.timeoutMs > 0) {
			const timer = new Promise<never>((_, reject) =>
				setTimeout(() => {
					this.timedOut = true;
					reject(
						new Error(
							`AsyncBarrier: timeout after ${this.timeoutMs}ms (${this.arrived}/${this.partySize} arrived)`,
						),
					);
				}, this.timeoutMs),
			);
			await Promise.race([this.readyPromise, timer]);
		} else {
			await this.readyPromise;
		}
	}

	/**
	 * Solo llegar (sin esperar). Útil para el último actor cuando
	 * el resto ya espera.
	 */
	arrive(): void {
		this.arrived++;
		if (this.arrived >= this.partySize && this.readyResolve) {
			this._released = true;
			this.readyResolve();
		}
	}

	/**
	 * Resetear la barrera para reutilización.
	 * Libera cualquier pending waiter resolviendo el promise actual.
	 */
	reset(): void {
		// Liberar waiters pendientes antes de resetear
		if (this.readyResolve && !this._released) {
			this._released = true;
			this.readyResolve();
		}
		this.arrived = 0;
		this.timedOut = false;
		this._released = false;
		this.readyPromise = new Promise((resolve) => {
			this.readyResolve = resolve;
		});
	}

	/** ¿La barrera ya liberó a todos? */
	get released(): boolean {
		return this._released;
	}

	/** ¿Hubo timeout? */
	get isTimedOut(): boolean {
		return this.timedOut;
	}

	/** Cuántos actores han llegado hasta ahora */
	get arrivedCount(): number {
		return this.arrived;
	}
}
