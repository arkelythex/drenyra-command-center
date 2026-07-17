import type { AgentMemoryRecord } from "./types";
export interface SessionCondenser {
    condense(records: AgentMemoryRecord[]): string;
}
export declare class SimpleSessionCondenser implements SessionCondenser {
    condense(records: AgentMemoryRecord[]): string;
}
//# sourceMappingURL=session-condenser.d.ts.map