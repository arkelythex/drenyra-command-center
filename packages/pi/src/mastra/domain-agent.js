export class DomainAgent {
    id;
    name;
    description;
    capabilities;
    primaryAgent;
    agents;
    config;
    constructor(agents, config) {
        this.agents = agents;
        this.config = config;
        this.id = config.id;
        this.name = config.name;
        this.description = config.description;
        this.capabilities = config.capabilities;
        this.primaryAgent = agents[0] ?? { id: config.id, name: config.name };
    }
    selectBestAgent(task) {
        if (task.tools?.length && this.agents.length > 1) {
            const matched = this.agents.find((a) => task.tools.some((t) => a.name.toLowerCase().includes(t.toLowerCase())));
            if (matched)
                return matched;
        }
        return this.primaryAgent;
    }
    async receiveTask(task) {
        const agent = this.selectBestAgent(task);
        return {
            domainId: this.id,
            taskId: task.id,
            status: "completed",
            data: {
                agent: agent.id,
                domain: this.id,
                goal: task.goal,
                tools: task.tools ?? [],
            },
            confidence: 0.85,
        };
    }
    async spawnSubAgent(task) {
        const subTaskId = `${task.id}-${crypto.randomUUID().slice(0, 8)}`;
        return {
            subTaskId,
            status: "completed",
            data: {
                goal: task.goal,
                domain: task.domain,
                tools: task.tools ?? [],
            },
            confidence: 0.8,
        };
    }
    async checkApproval(action) {
        if (!this.config.approvalRequired) {
            return { required: false };
        }
        const isFinancialAction = action.type === "financial" && (action.amount ?? 0) > 0;
        const isComplianceAction = action.type === "compliance";
        const needsApproval = isFinancialAction || isComplianceAction;
        if (!needsApproval) {
            return { required: false };
        }
        return {
            required: true,
            reason: `${action.type} action '${action.description}' requires approval`,
        };
    }
    async escalate(context) {
        if (context.attempts < this.config.maxRetries) {
            return {
                action: "retry",
                message: `Retrying task ${context.taskId} (attempt ${context.attempts + 1}/${this.config.maxRetries})`,
            };
        }
        return {
            action: "human",
            message: `Task ${context.taskId} exceeded max retries in domain '${this.name}'. Human intervention required.`,
            assignedTo: "domain-supervisor",
        };
    }
}
//# sourceMappingURL=domain-agent.js.map