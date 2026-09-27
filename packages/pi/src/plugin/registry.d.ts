import type { AgenticOSPlugin, AgentRegistry, ApprovalGateRegistry, DomainRegistry, DrenyraSkill, PolicyRegistry } from "./interface.js";
import { SessionManager } from "../mastra/session-manager.js";
export declare class PluginRegistry {
    private readonly plugins;
    private readonly skills;
    register(plugin: AgenticOSPlugin): void;
    getPlugin(name: string): AgenticOSPlugin | undefined;
    listPlugins(): AgenticOSPlugin[];
    createDomainRegistry(): DomainRegistry;
    createAgentRegistry(): AgentRegistry;
    createPolicyRegistry(): PolicyRegistry;
    createApprovalGateRegistry(): ApprovalGateRegistry;
    installSkill(skill: DrenyraSkill, sessionManager?: SessionManager): Promise<void>;
    uninstallSkill(id: string): boolean;
    findSkill(id: string): DrenyraSkill | undefined;
    listSkills(): DrenyraSkill[];
}
//# sourceMappingURL=registry.d.ts.map