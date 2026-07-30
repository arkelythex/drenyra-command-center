import type { AgentStatus } from "./types.js";
export interface LifecycleTransition {
    from: AgentStatus;
    to: AgentStatus;
    timestamp: string;
}
export interface LifecycleOptions {
    onTransition?: (transition: LifecycleTransition) => void;
    onError?: (message: string) => void;
}
export declare const VALID_TRANSITIONS: Record<AgentStatus, AgentStatus[]>;
export declare class AgentLifecycleManager {
    private current;
    private readonly options;
    constructor(initialStatus?: AgentStatus, options?: LifecycleOptions);
    getStatus(): AgentStatus;
    transitionTo(target: AgentStatus): void;
}
//# sourceMappingURL=lifecycle.d.ts.map