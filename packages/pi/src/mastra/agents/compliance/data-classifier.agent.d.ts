import { Agent } from "@mastra/core/agent";
import type { AgentPort, Task } from "../../../types/agent-core";
import type { ComplianceFinding } from "./compliance.types";
export type ClassificationRisk = "none" | "low" | "medium" | "high" | "critical";
export type DataCategory = "pii" | "fiscal_sensitive" | "financial" | "restricted" | "public";
export interface Classification {
    field: string;
    categories: readonly DataCategory[];
    risk: ClassificationRisk;
}
export interface ClassifierReport {
    classifications: readonly Classification[];
    unclassified: readonly string[];
    recommendations: readonly string[];
    findings: readonly ComplianceFinding[];
}
export declare const dataClassifierAgent: Agent<"data-classifier", import("@mastra/core/agent").ToolsInput, undefined, unknown, import("@mastra/core/agent").AgentEditorConfig | undefined>;
export declare const dataClassifierPort: AgentPort<Task, ClassifierReport>;
//# sourceMappingURL=data-classifier.agent.d.ts.map