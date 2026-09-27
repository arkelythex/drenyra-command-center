const _registeredAgents = new Map();
export function defineAgent(agent) {
    _registeredAgents.set(agent.id, agent);
}
export function getAllRegisteredAgents() {
    return Array.from(_registeredAgents.values());
}
export function getRegisteredAgent(id) {
    return _registeredAgents.get(id);
}
export function clearRegisteredAgents() {
    _registeredAgents.clear();
}
//# sourceMappingURL=agent-registry.js.map