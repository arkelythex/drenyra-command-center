import type { HubArtifact } from "../artifacts/types";
import type { SwarmTrace } from "../agents/types";
export interface CognitiveMessage {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Date;
    swarmTrace?: SwarmTrace;
    artifacts?: HubArtifact[];
}
//# sourceMappingURL=types.d.ts.map