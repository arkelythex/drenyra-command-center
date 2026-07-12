import type { AgentEvent } from "./agent-events";
export declare function serializeEvent(event: AgentEvent): string;
export declare function deserializeEvent(raw: string): AgentEvent | null;
export declare function isAgentEvent(data: unknown): data is AgentEvent;
//# sourceMappingURL=sse-helpers.d.ts.map
