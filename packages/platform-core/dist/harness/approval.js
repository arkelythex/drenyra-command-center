export class ApprovalWorkflow {
    gates = [];
    addGate(gate) {
        this.gates.push(gate);
    }
    addGates(gates) {
        this.gates.push(...gates);
    }
    removeGate(name) {
        const index = this.gates.findIndex((g) => g.name === name);
        if (index === -1)
            return false;
        this.gates.splice(index, 1);
        return true;
    }
    getGates() {
        return [...this.gates];
    }
    taskRequiresApproval(task, agentRequiresApproval) {
        if (agentRequiresApproval)
            return true;
        return this.gates.some((gate) => gate.condition(task));
    }
    async evaluate(request) {
        const results = [];
        for (const gate of this.gates) {
            if (!gate.condition(request.task))
                continue;
            if (gate.handler) {
                const approved = await gate.handler(request);
                results.push({
                    gate: gate.name,
                    approved,
                    reason: approved
                        ? undefined
                        : `Gate "${gate.name}" rejected the request`,
                });
            }
            else {
                results.push({
                    gate: gate.name,
                    approved: false,
                    reason: `Gate "${gate.name}" matches but no handler is registered`,
                });
            }
        }
        if (results.length === 0) {
            results.push({
                gate: "__default__",
                approved: true,
                reason: "No gates matched — auto-approved",
            });
        }
        return results;
    }
    clear() {
        this.gates = [];
    }
}
//# sourceMappingURL=approval.js.map