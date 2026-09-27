import type { PermissionService } from "../governance/permission-service";
import type { AgentRegistry } from "./agent-registry";
import type { PolicyEngine } from "./policy-engine";
import type { ToolRegistry } from "./tool-registry";
import type { TraceEvidenceStore } from "./trace-evidence";
export interface ControlPlane {
    policy: PolicyEngine;
    tools: ToolRegistry;
    agents: AgentRegistry;
    evidence: TraceEvidenceStore;
    permissionService?: PermissionService;
}
//# sourceMappingURL=control-plane.d.ts.map