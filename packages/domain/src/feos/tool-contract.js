import { FeosError } from "./types";
export const TOOL_RISK_LEVEL = {
    R0: "R0",
    R1: "R1",
    R2: "R2",
    R3: "R3",
};
export function riskLevelOrder(level) {
    switch (level) {
        case "R0": return 0;
        case "R1": return 1;
        case "R2": return 2;
        case "R3": return 3;
    }
}
export function riskLevelLabel(level) {
    switch (level) {
        case "R0": return "Flexible output permitted";
        case "R1": return "Structured output preferred";
        case "R2": return "Strict schema required";
        case "R3": return "Strict schema + deterministic validation + approval";
    }
}
export function createContractRegistry() {
    return new Map();
}
export function registerContract(registry, contract) {
    if (registry.has(contract.name)) {
        throw new FeosError("DUPLICATE_TOOL_CONTRACT", `Tool contract "${contract.name}" is already registered`, { toolName: contract.name });
    }
    registry.set(contract.name, contract);
}
export function getContract(registry, name) {
    const contract = registry.get(name);
    if (!contract) {
        throw new FeosError("UNKNOWN_TOOL_CONTRACT", `No tool contract found for "${name}"`, { toolName: name });
    }
    return contract;
}
export function validContractValidation() {
    return { passed: true, errors: [], warnings: [] };
}
export function invalidContractValidation(errors) {
    return { passed: false, errors, warnings: [] };
}
export function validateToolCall(contract, call) {
    const errors = [];
    if (riskLevelOrder(call.riskLevel) > riskLevelOrder(contract.riskLevel)) {
        errors.push({
            field: "riskLevel",
            message: `Call risk level "${call.riskLevel}" exceeds contract level "${contract.riskLevel}"`,
            code: "RISK_LEVEL_EXCEEDED",
        });
    }
    if (contract.riskLevel === "R3") {
        if (!contract.hasDeterministicValidator) {
            errors.push({
                field: "hasDeterministicValidator",
                message: "R3 tools must have a deterministic validator",
                code: "R3_MISSING_VALIDATOR",
            });
        }
        if (!contract.requiresApproval) {
            errors.push({
                field: "requiresApproval",
                message: "R3 tools must require explicit human approval",
                code: "R3_MISSING_APPROVAL",
            });
        }
    }
    if (riskLevelOrder(contract.riskLevel) >= 2) {
        if (!contract.inputSchema || Object.keys(contract.inputSchema).length === 0) {
            errors.push({
                field: "inputSchema",
                message: `R2/R3 tool "${contract.name}" must have a defined input schema`,
                code: "MISSING_INPUT_SCHEMA",
            });
        }
    }
    if (riskLevelOrder(contract.riskLevel) >= 2 && contract.requiredCapabilities.length === 0) {
        errors.push({
            field: "requiredCapabilities",
            message: `R2/R3 tool "${contract.name}" must require at least one capability`,
            code: "MISSING_CAPABILITIES",
        });
    }
    return errors.length > 0
        ? invalidContractValidation(errors)
        : validContractValidation();
}
export function modelSupportsRiskLevel(modelCapabilities, level) {
    switch (level) {
        case "R0":
            return true;
        case "R1":
            return modelCapabilities.supportsToolCalling || modelCapabilities.supportsJsonSchema;
        case "R2":
            return modelCapabilities.supportsConstrainedOutput && modelCapabilities.supportsJsonSchema;
        case "R3":
            return modelCapabilities.supportsConstrainedOutput
                && modelCapabilities.supportsJsonSchema
                && modelCapabilities.supportsToolCalling;
    }
}
export const DRENYRA_FINANCIAL_TOOL_CONTRACTS = [
    {
        name: "search_documents",
        riskLevel: "R0",
        outputMode: "flexible",
        description: "Search and retrieve financial documents using natural language queries",
        inputSchema: {
            type: "object",
            properties: {
                query: { type: "string", description: "Natural language search query" },
                limit: { type: "integer", default: 10, minimum: 1, maximum: 100 },
            },
            required: ["query"],
        },
        hasDeterministicValidator: false,
        requiresApproval: false,
        requiredCapabilities: ["document:search"],
        idempotent: true,
        version: "1.0.0",
    },
    {
        name: "explain_variance",
        riskLevel: "R1",
        outputMode: "preferred",
        description: "Explain a variance between two financial values or periods",
        inputSchema: {
            type: "object",
            properties: {
                accountId: { type: "string" },
                periodA: { type: "string", pattern: "^\\d{4}-\\d{2}$" },
                periodB: { type: "string", pattern: "^\\d{4}-\\d{2}$" },
            },
            required: ["accountId", "periodA", "periodB"],
        },
        outputSchema: {
            type: "object",
            properties: {
                variance: { type: "number" },
                percentage: { type: "number" },
                explanation: { type: "string" },
                confidence: { type: "string", enum: ["high", "medium", "low"] },
            },
        },
        hasDeterministicValidator: false,
        requiresApproval: false,
        requiredCapabilities: ["financial:explain"],
        idempotent: true,
        version: "1.0.0",
    },
    {
        name: "post_journal_entry",
        riskLevel: "R2",
        outputMode: "strict",
        description: "Post a journal entry to the ledger",
        inputSchema: {
            type: "object",
            properties: {
                description: { type: "string", minLength: 1, maxLength: 500 },
                lines: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            accountCode: { type: "string", pattern: "^\\d{2,6}$" },
                            debit: { type: "number", minimum: 0 },
                            credit: { type: "number", minimum: 0 },
                        },
                        required: ["accountCode"],
                    },
                    minItems: 2,
                },
                documentRef: { type: "string" },
            },
            required: ["description", "lines"],
        },
        hasDeterministicValidator: true,
        requiresApproval: false,
        requiredCapabilities: ["journal:post"],
        idempotent: true,
        version: "1.0.0",
    },
    {
        name: "prepare_sire_candidate",
        riskLevel: "R2",
        outputMode: "strict",
        description: "Prepare a SIRE filing candidate for review",
        inputSchema: {
            type: "object",
            properties: {
                period: { type: "string", pattern: "^\\d{4}-\\d{2}$" },
                bookType: { type: "string", enum: ["electronic", "purchase", "sales", "daily"] },
                companyRuc: { type: "string", pattern: "^\\d{11}$" },
            },
            required: ["period", "bookType", "companyRuc"],
        },
        hasDeterministicValidator: true,
        requiresApproval: false,
        requiredCapabilities: ["sire:prepare"],
        idempotent: true,
        version: "1.0.0",
    },
    {
        name: "approve_close",
        riskLevel: "R3",
        outputMode: "strict",
        description: "Approve and execute a fiscal period close",
        inputSchema: {
            type: "object",
            properties: {
                companyId: { type: "string" },
                period: { type: "string", pattern: "^\\d{4}-\\d{2}$" },
                closeChecklist: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            item: { type: "string" },
                            verified: { type: "boolean" },
                            evidenceRef: { type: "string" },
                        },
                    },
                },
            },
            required: ["companyId", "period", "closeChecklist"],
        },
        hasDeterministicValidator: true,
        requiresApproval: true,
        requiredCapabilities: ["close:approve"],
        idempotent: false,
        version: "1.0.0",
    },
    {
        name: "submit_sire_filing",
        riskLevel: "R3",
        outputMode: "strict",
        description: "Submit a SIRE filing to SUNAT (irreversible external action)",
        inputSchema: {
            type: "object",
            properties: {
                candidateId: { type: "string" },
                companyRuc: { type: "string", pattern: "^\\d{11}$" },
                period: { type: "string", pattern: "^\\d{4}-\\d{2}$" },
                bookType: { type: "string", enum: ["electronic", "purchase", "sales", "daily"] },
            },
            required: ["candidateId", "companyRuc", "period", "bookType"],
        },
        hasDeterministicValidator: true,
        requiresApproval: true,
        requiredCapabilities: ["sire:submit"],
        idempotent: true,
        version: "1.0.0",
    },
    {
        name: "initiate_payment",
        riskLevel: "R3",
        outputMode: "strict",
        description: "Initiate a payment to a supplier (irreversible external action)",
        inputSchema: {
            type: "object",
            properties: {
                companyId: { type: "string" },
                supplierRuc: { type: "string", pattern: "^\\d{11}$" },
                amount: { type: "number", minimum: 0.01 },
                currency: { type: "string", enum: ["PEN", "USD"] },
                invoiceRef: { type: "string" },
                paymentMethod: { type: "string", enum: ["wire", "check", "transfer"] },
            },
            required: ["companyId", "supplierRuc", "amount", "currency", "paymentMethod"],
        },
        hasDeterministicValidator: true,
        requiresApproval: true,
        requiredCapabilities: ["payment:initiate"],
        idempotent: true,
        version: "1.0.0",
    },
    {
        name: "lock_fiscal_period",
        riskLevel: "R3",
        outputMode: "strict",
        description: "Lock a fiscal period against further changes",
        inputSchema: {
            type: "object",
            properties: {
                companyId: { type: "string" },
                period: { type: "string", pattern: "^\\d{4}-\\d{2}$" },
                reason: { type: "string", minLength: 10 },
                approvedBy: { type: "string" },
            },
            required: ["companyId", "period", "reason", "approvedBy"],
        },
        hasDeterministicValidator: true,
        requiresApproval: true,
        requiredCapabilities: ["period:lock"],
        idempotent: true,
        version: "1.0.0",
    },
];
export function registerDrenyraContracts() {
    const registry = createContractRegistry();
    for (const contract of DRENYRA_FINANCIAL_TOOL_CONTRACTS) {
        registerContract(registry, contract);
    }
    return registry;
}
//# sourceMappingURL=tool-contract.js.map