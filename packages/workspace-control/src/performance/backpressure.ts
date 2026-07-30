import type { BackpressureState } from "./types";

// ─── Backpressure Manager ───────────────────────────────────────────────────

export interface BackpressureManager {
	enqueue(): boolean;
	dequeue(): void;
	readonly state: BackpressureState;
	reset(): void;
}

export class SimpleBackpressureManager implements BackpressureManager {
	private _eventsQueued: number;
	private _isThrottled: boolean;
	private _droppedSinceReset: number;
	private readonly _maxQueueSize: number;

	constructor(maxQueueSize: number = 1000) {
		this._maxQueueSize = maxQueueSize;
		this._eventsQueued = 0;
		this._isThrottled = false;
		this._droppedSinceReset = 0;
	}

	get state(): BackpressureState {
		return {
			eventsQueued: this._eventsQueued,
			maxQueueSize: this._maxQueueSize,
			isThrottled: this._isThrottled,
			droppedSinceReset: this._droppedSinceReset,
		};
	}

	enqueue(): boolean {
		if (this._eventsQueued >= this._maxQueueSize) {
			this._isThrottled = true;
			this._droppedSinceReset++;
			return false;
		}

		this._eventsQueued++;
		return true;
	}

	dequeue(): void {
		if (this._eventsQueued > 0) {
			this._eventsQueued--;
		}

		if (this._eventsQueued < this._maxQueueSize) {
			this._isThrottled = false;
		}
	}

	reset(): void {
		this._eventsQueued = 0;
		this._isThrottled = false;
		this._droppedSinceReset = 0;
	}
}
