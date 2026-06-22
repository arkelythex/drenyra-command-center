/**
 * ControlPlane — Central interface for the AI control plane.
 *
 * Groups the policy engine, tool registry, agent registry, evidence store,
 * and permission service into a single composable unit.
 */

import type { PolicyEngine } from "./policy-engine";
import type { ToolRegistry } from "./tool-registry";
import type { AgentRegistry } from "./agent-registry";
import type { TraceEvidenceStore } from "./trace-evidence";
import type { PermissionService } from "../governance/permission-service";

export interface ControlPlane {
	policy: PolicyEngine;
	tools: ToolRegistry;
	agents: AgentRegistry;
	evidence: TraceEvidenceStore;
	permissionService?: PermissionService;
}
