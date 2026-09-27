import { ApprovalWorkflow, DelegationGraph, } from "../harness-core";
import { registerDefaultHandlers, validateSpawnPlan, } from "./handlers/defaults.js";
export const MAX_DELEGATION_DEPTH = 3;
export const DELEGATION_AGENTS = {
    "drenyra-orchestrator": {
        id: "drenyra-orchestrator",
        tier: "tier0",
        label: "Mother orchestrator",
        maySpawn: ["drenyra-sdd-orchestrator", "kuntur-sdd-orchestrator"],
    },
    "drenyra-sdd-orchestrator": {
        id: "drenyra-sdd-orchestrator",
        tier: "tier1",
        label: "Drenyra SDD coordinator",
        maySpawn: [
            "fiscal-command-orchestrator",
            "ai-swarm-orchestrator",
            "drenyra-hr-orchestrator",
        ],
    },
    "fiscal-command-orchestrator": {
        id: "fiscal-command-orchestrator",
        tier: "tier2",
        label: "Fiscal command",
        maySpawn: [
            "fiscal-sunat-agent",
            "fiscal-ledger-agent",
            "fiscal-reconcile-agent",
        ],
        parent: "drenyra-sdd-orchestrator",
    },
    "ai-swarm-orchestrator": {
        id: "ai-swarm-orchestrator",
        tier: "tier2",
        label: "AI swarm",
        maySpawn: ["swarm-codegen-agent", "swarm-test-agent", "swarm-review-agent"],
        parent: "drenyra-sdd-orchestrator",
    },
    "drenyra-hr-orchestrator": {
        id: "drenyra-hr-orchestrator",
        tier: "tier2",
        label: "Drenyra HR",
        maySpawn: ["hr-payroll-agent", "hr-compliance-agent"],
        parent: "drenyra-sdd-orchestrator",
    },
    "fiscal-sunat-agent": {
        id: "fiscal-sunat-agent",
        tier: "tier3",
        label: "SUNAT specialist",
        maySpawn: ["fiscal-sunat-payload-agent"],
        parent: "fiscal-command-orchestrator",
    },
    "fiscal-sunat-payload-agent": {
        id: "fiscal-sunat-payload-agent",
        tier: "tier3_nested",
        label: "SUNAT payload drafter",
        maySpawn: [],
        requiresApproval: true,
        leaf: true,
        parent: "fiscal-sunat-agent",
    },
    "fiscal-ledger-agent": {
        id: "fiscal-ledger-agent",
        tier: "tier3",
        label: "Ledger specialist",
        maySpawn: [],
        leaf: true,
        parent: "fiscal-command-orchestrator",
    },
    "fiscal-reconcile-agent": {
        id: "fiscal-reconcile-agent",
        tier: "tier3",
        label: "Reconciliation specialist",
        maySpawn: [],
        leaf: true,
        parent: "fiscal-command-orchestrator",
    },
    "hr-payroll-agent": {
        id: "hr-payroll-agent",
        tier: "tier3",
        label: "Payroll specialist",
        maySpawn: [],
        leaf: true,
        parent: "drenyra-hr-orchestrator",
    },
    "hr-compliance-agent": {
        id: "hr-compliance-agent",
        tier: "tier3",
        label: "HR compliance specialist",
        maySpawn: [],
        leaf: true,
        parent: "drenyra-hr-orchestrator",
    },
    "swarm-codegen-agent": {
        id: "swarm-codegen-agent",
        tier: "tier3",
        label: "Codegen leaf",
        maySpawn: [],
        leaf: true,
        parent: "ai-swarm-orchestrator",
    },
    "swarm-test-agent": {
        id: "swarm-test-agent",
        tier: "tier3",
        label: "Test leaf",
        maySpawn: [],
        leaf: true,
        parent: "ai-swarm-orchestrator",
    },
    "swarm-review-agent": {
        id: "swarm-review-agent",
        tier: "tier3",
        label: "Review leaf",
        maySpawn: [],
        leaf: true,
        parent: "ai-swarm-orchestrator",
    },
};
const FISCAL_KEYWORDS = [
    "sunat",
    "sire",
    "cpe",
    "ruc",
    "libro",
    "ple",
    "fiscal",
    "concili",
    "asiento",
    "ledger",
];
const HR_KEYWORDS = ["payroll", "plame", "nomina", "employee", "hr"];
const SWARM_KEYWORDS = ["implement", "refactor", "test", "review", "codegen"];
export function resolveRootAgentId(task) {
    const lower = task.toLowerCase();
    if (FISCAL_KEYWORDS.some((k) => lower.includes(k))) {
        return "fiscal-command-orchestrator";
    }
    if (HR_KEYWORDS.some((k) => lower.includes(k))) {
        return "drenyra-hr-orchestrator";
    }
    if (SWARM_KEYWORDS.some((k) => lower.includes(k))) {
        return "ai-swarm-orchestrator";
    }
    return "fiscal-command-orchestrator";
}
export function getAgentNode(agentId) {
    return DELEGATION_AGENTS[agentId];
}
export function canSpawn(parentId, childId) {
    const parent = DELEGATION_AGENTS[parentId];
    return parent?.maySpawn.includes(childId) ?? false;
}
const FISCAL_APPROVAL_KEYWORDS = [
    "sunat",
    "filing",
    "submit",
    "approve",
    "confirm",
    "cpe",
    "sire",
    "declaracion",
    "detraccion",
    "retencion",
];
function newRunId() {
    return crypto.randomUUID();
}
function mergeStatus(nodes) {
    if (nodes.some((n) => n.status === "blocked"))
        return "blocked";
    if (nodes.some((n) => n.status === "pending_approval"))
        return "pending_approval";
    if (nodes.some((n) => n.status === "partial"))
        return "partial";
    return "done";
}
export function createDefaultDelegationGraph() {
    const graph = new DelegationGraph();
    const nodes = Object.values(DELEGATION_AGENTS).map((agent) => ({
        id: agent.id,
        label: agent.label,
        maySpawn: agent.maySpawn,
        requiresApproval: agent.requiresApproval,
        parent: agent.parent,
    }));
    graph.registerNodes(nodes);
    return graph;
}
export function createDefaultApprovalWorkflow() {
    const workflow = new ApprovalWorkflow();
    for (const keyword of FISCAL_APPROVAL_KEYWORDS) {
        workflow.addGate({
            name: `fiscal-${keyword}`,
            description: `Tasks containing "${keyword}" require approval`,
            condition: (task) => task.toLowerCase().includes(keyword),
        });
    }
    return workflow;
}
export class DrenyraHarness {
    maxDepth;
    handlers;
    onApprovalRequired;
    delegationGraph;
    approvalWorkflow;
    constructor(options = {}) {
        this.maxDepth = options.maxDepth ?? MAX_DELEGATION_DEPTH;
        this.handlers = options.handlers ?? new Map();
        this.onApprovalRequired = options.onApprovalRequired;
        this.delegationGraph =
            options.delegationGraph ?? createDefaultDelegationGraph();
        this.approvalWorkflow =
            options.approvalWorkflow ?? createDefaultApprovalWorkflow();
        registerDefaultHandlers(this.handlers);
    }
    registerHandler(agentId, handler) {
        this.handlers.set(agentId, handler);
    }
    getRegisteredAgents() {
        return [...this.handlers.keys()];
    }
    canSpawnAgent(parentId, childId, depth) {
        if (depth >= this.maxDepth)
            return false;
        return this.delegationGraph.canSpawn(parentId, childId);
    }
    async execute(request) {
        const rootAgentId = request.rootAgentId ?? resolveRootAgentId(request.task);
        const node = await this.run({
            agentId: rootAgentId,
            task: request.task,
            context: request.context,
            depth: 0,
        });
        if (request.autoSpawn && node.result.spawn?.length) {
            node.children = await this.runSpawnChildren(rootAgentId, node.result.spawn, request.task, request.context, node.runId, 1);
            node.status = mergeStatus([node, ...node.children]);
        }
        return {
            traceId: request.context.traceId,
            rootAgentId,
            status: node.status,
            tree: node,
            executiveSummary: node.result.executiveSummary,
        };
    }
    async spawn(request) {
        return this.run(request);
    }
    async runSpawnChildren(parentId, spawn, fallbackTask, context, parentRunId, depth) {
        const planErrors = validateSpawnPlan(parentId, spawn);
        if (planErrors.length > 0) {
            return [
                {
                    runId: newRunId(),
                    agentId: parentId,
                    depth,
                    status: "blocked",
                    result: {
                        status: "blocked",
                        executiveSummary: planErrors.join("; "),
                        artifacts: [],
                        nextRecommended: "human_approval",
                        risks: planErrors,
                        delegationDepth: depth,
                    },
                    children: [],
                    startedAt: new Date().toISOString(),
                    endedAt: new Date().toISOString(),
                },
            ];
        }
        const nodes = [];
        for (const child of spawn) {
            const node = await this.run({
                agentId: child.agentId,
                task: child.task || fallbackTask,
                context,
                parentRunId,
                depth,
            });
            if (node.result.spawn?.length && depth + 1 < this.maxDepth) {
                node.children = await this.runSpawnChildren(child.agentId, node.result.spawn, child.task, context, node.runId, depth + 1);
                node.status = mergeStatus([node, ...node.children]);
            }
            nodes.push(node);
        }
        return nodes;
    }
    async run(request) {
        const startedAt = new Date().toISOString();
        const runId = newRunId();
        const depth = request.depth ?? 0;
        const agent = getAgentNode(request.agentId);
        if (!agent) {
            return this.blockedNode(runId, request.agentId, depth, startedAt, `Unknown agent: ${request.agentId}`);
        }
        if (depth > this.maxDepth) {
            return this.blockedNode(runId, request.agentId, depth, startedAt, `Max delegation depth (${this.maxDepth}) exceeded`);
        }
        const handler = this.handlers.get(request.agentId);
        if (!handler) {
            return this.blockedNode(runId, request.agentId, depth, startedAt, `No handler for ${request.agentId}`);
        }
        const needsApproval = (agent.leaf && agent.requiresApproval) ||
            this.approvalWorkflow.taskRequiresApproval(request.task, agent.requiresApproval);
        if (needsApproval && this.onApprovalRequired) {
            const approved = await this.onApprovalRequired({
                agentId: request.agentId,
                task: request.task,
                context: request.context,
                runId,
            });
            if (!approved) {
                return {
                    runId,
                    agentId: request.agentId,
                    depth,
                    status: "pending_approval",
                    result: {
                        status: "pending_approval",
                        executiveSummary: "Waiting for human approval",
                        artifacts: [],
                        nextRecommended: "human_approval",
                        risks: ["Approval gate blocked execution"],
                        delegationDepth: depth,
                        requiresApproval: true,
                    },
                    children: [],
                    startedAt,
                    endedAt: new Date().toISOString(),
                };
            }
        }
        const result = await handler({ ...request, runId, depth });
        const status = result.status;
        return {
            runId,
            agentId: request.agentId,
            depth,
            status,
            result,
            children: [],
            startedAt,
            endedAt: new Date().toISOString(),
        };
    }
    blockedNode(runId, agentId, depth, startedAt, message) {
        return {
            runId,
            agentId,
            depth,
            status: "blocked",
            result: {
                status: "blocked",
                executiveSummary: message,
                artifacts: [],
                nextRecommended: "drenyra-sdd-orchestrator",
                risks: [message],
                delegationDepth: depth,
            },
            children: [],
            startedAt,
            endedAt: new Date().toISOString(),
        };
    }
}
export function createDrenyraHarness(options) {
    return new DrenyraHarness(options);
}
//# sourceMappingURL=harness.js.map