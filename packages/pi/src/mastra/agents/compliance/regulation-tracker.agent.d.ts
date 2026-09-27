import { Agent } from "@mastra/core/agent";
import type { AgentPort, Task } from "../../../types/agent-core";
import type { ComplianceFinding } from "./compliance.types";
export type RegulationStatus = "active" | "pending" | "exempt";
export interface Regulation {
    id: string;
    name: string;
    jurisdiction: string;
    status: RegulationStatus;
}
export interface RegulationReport {
    regulations: readonly Regulation[];
    gaps: readonly string[];
    findings: readonly ComplianceFinding[];
}
export declare const regulationTrackerAgent: Agent<"regulation-tracker", import("@mastra/core/agent").ToolsInput, undefined, unknown, import("@mastra/core/agent").AgentEditorConfig | undefined>;
export declare const regulationTrackerPort: AgentPort<Task, RegulationReport>;
//# sourceMappingURL=regulation-tracker.agent.d.ts.map