import type { AgentEvent as CanonicalEvent } from "@drenyra/shared";
import type { EventBus } from "../agents/types/workflow.types";
export interface EventAdapter {
    subscribe(eventBus: EventBus, onEvent: (event: CanonicalEvent) => void): void;
    unsubscribe(): void;
}
//# sourceMappingURL=types.d.ts.map