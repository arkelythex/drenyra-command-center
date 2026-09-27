import type { FailureContext, FailureProbe, FailureStage } from "@drenyra/persistence";
import type { AsyncBarrier } from "./async-barrier";
export declare class SimulatedProcessCrash extends Error {
    constructor(stage?: string);
}
export type FailureAction = {
    kind: "throw";
    error: Error;
} | {
    kind: "crash";
} | {
    kind: "block";
    barrier: AsyncBarrier;
} | {
    kind: "callback";
    run: (context: FailureContext) => void | Promise<void>;
};
export declare class DeterministicFailureHarness implements FailureProbe {
    private readonly failpoints;
    inject(name: string, action: FailureAction, options?: {
        maxActivations?: number;
        stage?: FailureStage;
        filter?: (ctx: FailureContext) => boolean;
    }): void;
    hit(stage: FailureStage, context?: FailureContext): Promise<void>;
    remove(name: string): void;
    reset(): void;
    stats(name: string): {
        hits: number;
        activations: number;
    } | undefined;
    list(): string[];
    get hasActive(): boolean;
    private findCandidates;
}
//# sourceMappingURL=failure-harness.d.ts.map