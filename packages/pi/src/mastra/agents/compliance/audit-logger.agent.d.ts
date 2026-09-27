import { Agent } from "@mastra/core/agent";
import type { AgentPort, Task } from "../../../types/agent-core";
import type { ComplianceFinding } from "./compliance.types";
export interface AuditEvent {
    id: string;
    actor: string;
    action: string;
    timestamp: string;
    traceId?: string;
    evidenceRefs?: readonly string[];
    approvalId?: string;
    scope?: string;
    metadata?: Record<string, unknown>;
}
export interface AuditReport {
    events: readonly AuditEvent[];
    findings: readonly ComplianceFinding[];
    tamperProof: boolean;
    coverage: number;
}
export declare const auditLoggerAgent: Agent<"audit-logger", import("@mastra/core/agent").ToolsInput, undefined, unknown, import("@mastra/core/agent").AgentEditorConfig | undefined>;
export declare const auditLoggerPort: AgentPort<Task, AuditReport>;
//# sourceMappingURL=audit-logger.agent.d.ts.map