import { ResultMerger } from "./result-merger";
import { SessionManager } from "./session-manager";
import { Supervisor } from "./supervisor";
import { TaskDecomposer } from "./task-decomposer";
export class LatinModernoOrchestrator {
    domainAgents = new Map();
    taskDecomposer;
    resultMerger;
    supervisor;
    sessionManager;
    constructor(_options = { mode: "hierarchy" }) {
        this.taskDecomposer = new TaskDecomposer();
        this.resultMerger = new ResultMerger();
        this.supervisor = new Supervisor();
        this.sessionManager = new SessionManager();
    }
    registerDomainAgent(agent) {
        this.domainAgents.set(agent.id, agent);
    }
    getDomainAgent(id) {
        return this.domainAgents.get(id);
    }
    getAllDomainAgents() {
        return Array.from(this.domainAgents.values());
    }
    async handleRequest(intent, context, sessionId) {
        const traceId = crypto.randomUUID();
        const session = sessionId
            ? this.sessionManager.get(sessionId)
            : this.sessionManager.create(intent, context);
        const actualSessionId = session?.id ?? this.sessionManager.create(intent, context).id;
        const availableDomains = Array.from(this.domainAgents.keys());
        const decomposition = this.taskDecomposer.decompose(intent, context, availableDomains);
        const results = [];
        for (const group of decomposition.parallelGroups) {
            const groupResults = await Promise.all(group.map(async (stepId) => {
                const step = decomposition.steps.find((s) => s.id === stepId);
                if (!step)
                    return [];
                const domainAgent = this.domainAgents.get(step.domain);
                if (!domainAgent)
                    return [];
                const startTime = new Date();
                this.sessionManager.addStep(actualSessionId, step.domain);
                try {
                    const result = await domainAgent.receiveTask({
                        id: stepId,
                        goal: step.goal,
                        context,
                        tools: step.tools,
                    });
                    this.sessionManager.updateStep(actualSessionId, `${actualSessionId}-${step.domain}`, {
                        status: "completed",
                        result: result.data,
                        startedAt: startTime,
                        completedAt: new Date(),
                    });
                    this.supervisor.recordTiming(step.domain, startTime, new Date());
                    return [
                        {
                            domainId: step.domain,
                            data: result.data,
                            confidence: result.confidence,
                        },
                    ];
                }
                catch (error) {
                    this.sessionManager.updateStep(actualSessionId, `${actualSessionId}-${step.domain}`, {
                        status: "failed",
                        error: error instanceof Error ? error.message : "Unknown error",
                        startedAt: startTime,
                        completedAt: new Date(),
                    });
                    return [
                        {
                            domainId: step.domain,
                            data: {
                                error: error instanceof Error ? error.message : "Unknown error",
                            },
                            confidence: 0,
                        },
                    ];
                }
            }));
            for (const grp of groupResults) {
                results.push(...grp);
            }
            const canProceed = this.supervisor.canProceed(results.map((r) => ({
                domainId: r.domainId,
                status: r.confidence > 0 ? "completed" : "error",
            })));
            if (!canProceed.proceed) {
                return {
                    success: false,
                    data: { error: canProceed.reason },
                    conflicts: [],
                    traceId,
                    sessionId: actualSessionId,
                    timings: this.supervisor.getTimings(),
                };
            }
        }
        const merged = this.resultMerger.merge(results);
        const resolved = this.supervisor.resolveConflicts(merged.conflicts);
        this.sessionManager.update(actualSessionId, {
            status: merged.success ? "completed" : "failed",
        });
        return {
            success: merged.success,
            data: merged.data,
            conflicts: resolved,
            traceId,
            sessionId: actualSessionId,
            timings: this.supervisor.getTimings(),
        };
    }
}
//# sourceMappingURL=latin-orchestrator.js.map