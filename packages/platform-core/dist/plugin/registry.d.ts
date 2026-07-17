import type { AgenticOSPlugin, DomainRegistry, AgentRegistry, PolicyRegistry, ApprovalGateRegistry } from "./interface.js";
export declare class PluginRegistry {
    private readonly plugins;
    register(plugin: AgenticOSPlugin): void;
    getPlugin(name: string): AgenticOSPlugin | undefined;
    listPlugins(): AgenticOSPlugin[];
    createDomainRegistry(): DomainRegistry;
    createAgentRegistry(): AgentRegistry;
    createPolicyRegistry(): PolicyRegistry;
    createApprovalGateRegistry(): ApprovalGateRegistry;
}
//# sourceMappingURL=registry.d.ts.map