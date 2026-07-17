import type { AgenticOSPlugin, DomainRegistry, AgentRegistry, PolicyRegistry, ApprovalGateRegistry } from "./interface.js";
export declare class FiscalPlugin implements AgenticOSPlugin {
    readonly name = "fiscal";
    readonly version = "1.0.0";
    readonly description = "Peruvian fiscal compliance vertical \u2014 SUNAT electronic invoicing, detractions, tax declarations, audit trails, and compliance reporting";
    registerDomain(registry: DomainRegistry): void;
    registerAgents(registry: AgentRegistry): void;
    registerPolicies(registry: PolicyRegistry): void;
    registerApprovalGates(registry: ApprovalGateRegistry): void;
}
//# sourceMappingURL=fiscal-plugin.d.ts.map