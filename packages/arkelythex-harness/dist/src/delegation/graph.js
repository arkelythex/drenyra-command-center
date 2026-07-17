export const MAX_DELEGATION_DEPTH = 3;
export const DELEGATION_AGENTS = {
    "arkelythex-orchestrator": {
        id: "arkelythex-orchestrator",
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
        maySpawn: [
            "swarm-codegen-agent",
            "swarm-test-agent",
            "swarm-review-agent",
        ],
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
//# sourceMappingURL=graph.js.map