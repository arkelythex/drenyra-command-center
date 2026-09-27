export declare class AsyncBarrier {
    private readonly partySize;
    private readonly timeoutMs;
    private arrived;
    private readyResolve;
    private readyPromise;
    private timedOut;
    private _released;
    constructor(partySize: number, timeoutMs?: number);
    arriveAndWait(): Promise<void>;
    arrive(): void;
    reset(): void;
    get released(): boolean;
    get isTimedOut(): boolean;
    get arrivedCount(): number;
}
//# sourceMappingURL=async-barrier.d.ts.map