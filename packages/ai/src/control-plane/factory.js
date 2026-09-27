import { PermissionService } from "../governance/permission-service";
import { AgentRegistry } from "./agent-registry";
import { PolicyEngine } from "./policy-engine";
import { ToolRegistry } from "./tool-registry";
import { createInMemoryTraceEvidenceStore, createPostgresTraceEvidenceStore, } from "./trace-evidence";
export function createControlPlane(db, config = {}) {
    const evidence = config.evidenceStore ??
        (config.usePostgresEvidence
            ? createPostgresTraceEvidenceStore(db)
            : createInMemoryTraceEvidenceStore());
    const tools = new ToolRegistry(db);
    const agents = new AgentRegistry(db);
    const permissionService = config.permissionService ?? new PermissionService();
    const policy = new PolicyEngine(agents, tools, evidence, permissionService);
    return {
        policy,
        tools,
        agents,
        evidence,
        permissionService,
    };
}
//# sourceMappingURL=factory.js.map