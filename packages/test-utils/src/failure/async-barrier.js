export class AsyncBarrier {
    partySize;
    timeoutMs;
    arrived = 0;
    readyResolve = null;
    readyPromise = null;
    timedOut = false;
    _released = false;
    constructor(partySize, timeoutMs = 5_000) {
        if (partySize < 1)
            throw new Error("AsyncBarrier: partySize must be >= 1");
        this.partySize = partySize;
        this.timeoutMs = timeoutMs;
        this.readyPromise = new Promise((resolve) => {
            this.readyResolve = resolve;
        });
    }
    async arriveAndWait() {
        this.arrived++;
        if (this.arrived >= this.partySize) {
            this._released = true;
            this.readyResolve?.();
            return;
        }
        if (!this.readyPromise)
            return;
        if (this.timeoutMs > 0) {
            const timer = new Promise((_, reject) => setTimeout(() => {
                this.timedOut = true;
                reject(new Error(`AsyncBarrier: timeout after ${this.timeoutMs}ms (${this.arrived}/${this.partySize} arrived)`));
            }, this.timeoutMs));
            await Promise.race([this.readyPromise, timer]);
        }
        else {
            await this.readyPromise;
        }
    }
    arrive() {
        this.arrived++;
        if (this.arrived >= this.partySize && this.readyResolve) {
            this._released = true;
            this.readyResolve();
        }
    }
    reset() {
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
    get released() {
        return this._released;
    }
    get isTimedOut() {
        return this.timedOut;
    }
    get arrivedCount() {
        return this.arrived;
    }
}
//# sourceMappingURL=async-barrier.js.map