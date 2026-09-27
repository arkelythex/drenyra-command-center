import type { AgenticOSPlugin } from "./interface.js";
export interface PluginLifecycleConfig {
    validateOnRegister: boolean;
    strictMode: boolean;
}
export interface RegisteredPlugin {
    plugin: AgenticOSPlugin;
    registeredAt: string;
    domainEntityCount: number;
    agentTypeCount: number;
    policyCount: number;
    gateCount: number;
}
//# sourceMappingURL=types.d.ts.map