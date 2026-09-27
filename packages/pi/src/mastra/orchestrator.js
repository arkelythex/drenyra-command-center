import { LexoriSkillResolver } from "../lexori/lexori.resolver";
import { ApprovalGateEngine } from "./approval-gate";
import { ApprovalStore } from "./approval-store";
import { AgentEventBus } from "./event-bus";
import { IntentDetector } from "./intent-detector";
import { LatinModernoOrchestrator } from "./latin-orchestrator";
export class DrenyraOrchestrator {
    lexoriProvider;
    agents = new Map();
    approvalGate;
    eventBus;
    detectIntent;
    swarmOrchestrator;
    swarmMode = "flat";
    constructor(approvalGate, eventBus, detectIntent, lexoriProvider) {
        this.lexoriProvider = lexoriProvider;
        this.approvalGate = approvalGate;
        this.eventBus = eventBus;
        this.detectIntent = detectIntent;
    }
    registerAgent(agent) {
        this.agents.set(agent.id, agent);
    }
    getAgent(id) {
        return this.agents.get(id);
    }
    getAllAgents() {
        return Array.from(this.agents.values());
    }
    enableSwarmMode(orchestrator) {
        this.swarmOrchestrator = orchestrator;
        this.swarmMode = "hierarchy";
    }
    disableSwarmMode() {
        this.swarmOrchestrator = undefined;
        this.swarmMode = "flat";
    }
    isSwarmMode() {
        return (this.swarmMode === "hierarchy" && this.swarmOrchestrator !== undefined);
    }
    async handleInput(input, context, sessionId) {
        const actualSessionId = sessionId ?? crypto.randomUUID();
        const intent = await this.detectIntent(input, context);
        let lexoriContext;
        if (this.lexoriProvider) {
            lexoriContext = await this.lexoriProvider.resolveForAgent(intent.agent, {
                ruc: context.ruc ?? "",
                periodo: "",
            });
        }
        if (this.isSwarmMode() && this.swarmOrchestrator) {
            const swarmResult = await this.swarmOrchestrator.handleRequest(input, context, actualSessionId);
            return {
                sessionId: actualSessionId,
                intent,
                result: {
                    success: swarmResult.success,
                    data: swarmResult.data,
                },
                agent: "swarm",
                lexoriContext,
            };
        }
        const agent = this.agents.get(intent.agent);
        if (!agent) {
            return {
                sessionId: actualSessionId,
                intent,
                result: {
                    success: false,
                    error: `No agent registered for '${intent.agent}'`,
                },
                agent: intent.agent,
            };
        }
        await this.eventBus.publish("agent.task.decomposed", {
            agent: intent.agent,
            tool: intent.tool,
            sessionId: actualSessionId,
        }, context);
        return {
            sessionId: actualSessionId,
            intent,
            result: {
                success: true,
                data: { agent: agent.id, intent: intent.tool, input },
            },
            agent: intent.agent,
            lexoriContext,
        };
    }
    getApprovalGate() {
        return this.approvalGate;
    }
    getEventBus() {
        return this.eventBus;
    }
}
export function createDrenyraOrchestrator(options = {}) {
    const approvalStore = new ApprovalStore();
    const eventBus = new AgentEventBus();
    const intentDetector = new IntentDetector();
    const approvalGate = new ApprovalGateEngine(approvalStore, options.governanceValidator, options.notifyCallback);
    const lexoriResolver = options.withLexori
        ? new LexoriSkillResolver()
        : undefined;
    const orchestrator = new DrenyraOrchestrator(approvalGate, eventBus, (input, context) => intentDetector.detectIntent(input, context), lexoriResolver);
    let latinOrchestrator;
    if (options.swarmMode === "hierarchy") {
        latinOrchestrator = new LatinModernoOrchestrator({ mode: "hierarchy" });
        orchestrator.enableSwarmMode(latinOrchestrator);
    }
    return {
        orchestrator,
        approvalStore,
        approvalGate,
        eventBus,
        intentDetector,
        latinOrchestrator,
        lexoriResolver,
    };
}
//# sourceMappingURL=orchestrator.js.map