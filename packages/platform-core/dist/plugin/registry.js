class DefaultDomainRegistry {
    entities = [];
    rules = [];
    registerEntity(name, schema) {
        this.entities.push({ name, schema });
    }
    registerRule(name, rule) {
        this.rules.push({ name, rule });
    }
}
class DefaultAgentRegistry {
    agentTypes = [];
    capabilities = [];
    registerAgentType(type, factory) {
        this.agentTypes.push({ type, factory });
    }
    registerCapability(agentType, capability) {
        this.capabilities.push({ agentType, capability });
    }
}
class DefaultPolicyRegistry {
    policies = [];
    registerPolicy(name, policy) {
        this.policies.push({ name, policy });
    }
}
class DefaultApprovalGateRegistry {
    gates = [];
    registerGate(name, gate) {
        this.gates.push({ name, gate });
    }
}
export class PluginRegistry {
    plugins = new Map();
    register(plugin) {
        this.plugins.set(plugin.name, plugin);
    }
    getPlugin(name) {
        return this.plugins.get(name);
    }
    listPlugins() {
        return Array.from(this.plugins.values());
    }
    createDomainRegistry() {
        return new DefaultDomainRegistry();
    }
    createAgentRegistry() {
        return new DefaultAgentRegistry();
    }
    createPolicyRegistry() {
        return new DefaultPolicyRegistry();
    }
    createApprovalGateRegistry() {
        return new DefaultApprovalGateRegistry();
    }
}
//# sourceMappingURL=registry.js.map