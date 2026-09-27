export class SimulatedProcessCrash extends Error {
    constructor(stage) {
        const msg = stage
            ? `SIMULATED_PROCESS_CRASH at ${stage}`
            : "SIMULATED_PROCESS_CRASH";
        super(msg);
        this.name = "SimulatedProcessCrash";
    }
}
export class DeterministicFailureHarness {
    failpoints = new Map();
    inject(name, action, options) {
        this.failpoints.set(name, {
            config: {
                action,
                maxActivations: options?.maxActivations ?? 1,
                stage: options?.stage,
                filter: options?.filter,
            },
            totalHits: 0,
            totalActivations: 0,
        });
    }
    async hit(stage, context) {
        const candidates = this.findCandidates(stage);
        for (const state of candidates) {
            state.totalHits++;
            if (state.config.filter && context && !state.config.filter(context)) {
                continue;
            }
            if (state.totalActivations >= state.config.maxActivations) {
                continue;
            }
            state.totalActivations++;
            switch (state.config.action.kind) {
                case "throw":
                    throw state.config.action.error;
                case "crash":
                    throw new SimulatedProcessCrash(stage);
                case "block":
                    await state.config.action.barrier.arriveAndWait();
                    break;
                case "callback": {
                    const result = state.config.action.run(context ?? {});
                    if (result instanceof Promise) {
                        await result;
                    }
                    break;
                }
            }
        }
    }
    remove(name) {
        this.failpoints.delete(name);
    }
    reset() {
        for (const state of this.failpoints.values()) {
            if (state.config.action.kind === "block") {
                state.config.action.barrier.reset();
            }
        }
        this.failpoints.clear();
    }
    stats(name) {
        const state = this.failpoints.get(name);
        if (!state)
            return undefined;
        return { hits: state.totalHits, activations: state.totalActivations };
    }
    list() {
        return Array.from(this.failpoints.keys());
    }
    get hasActive() {
        return Array.from(this.failpoints.values()).some((s) => s.totalActivations < s.config.maxActivations);
    }
    findCandidates(stage) {
        const results = [];
        for (const state of this.failpoints.values()) {
            if (state.config.stage && state.config.stage !== stage)
                continue;
            results.push(state);
        }
        return results;
    }
}
//# sourceMappingURL=failure-harness.js.map