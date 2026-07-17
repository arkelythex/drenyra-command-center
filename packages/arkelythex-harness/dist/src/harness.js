import { canSpawn, getAgentNode, MAX_DELEGATION_DEPTH, resolveRootAgentId, } from "./delegation/graph.js";
import { registerDefaultHandlers, validateSpawnPlan } from "./handlers/defaults.js";
import { taskRequiresApproval } from "./approval.js";
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
export class ArkelythexHarness {
    maxDepth;
    handlers;
    onApprovalRequired;
    constructor(options = {}) {
        this.maxDepth = options.maxDepth ?? MAX_DELEGATION_DEPTH;
        this.handlers = options.handlers ?? new Map();
        this.onApprovalRequired = options.onApprovalRequired;
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
        return canSpawn(parentId, childId);
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
            getAgentNode(child.agentId);
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
            taskRequiresApproval(request.task, agent.requiresApproval);
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
export function createArkelythexHarness(options) {
    return new ArkelythexHarness(options);
}
//# sourceMappingURL=harness.js.map