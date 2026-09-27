import type { Actor, FiscalScope } from "./types";
export declare const TOOL_RISK_LEVEL: {
    readonly R0: "R0";
    readonly R1: "R1";
    readonly R2: "R2";
    readonly R3: "R3";
};
export type ToolRiskLevel = (typeof TOOL_RISK_LEVEL)[keyof typeof TOOL_RISK_LEVEL];
export declare function riskLevelOrder(level: ToolRiskLevel): number;
export declare function riskLevelLabel(level: ToolRiskLevel): string;
export type SchemaOutputMode = "flexible" | "preferred" | "strict";
export interface ToolContract {
    name: string;
    riskLevel: ToolRiskLevel;
    outputMode: SchemaOutputMode;
    description: string;
    inputSchema: Record<string, unknown>;
    outputSchema?: Record<string, unknown>;
    hasDeterministicValidator: boolean;
    requiresApproval: boolean;
    requiredCapabilities: string[];
    timeoutMs?: number;
    idempotent: boolean;
    version: string;
}
export interface ToolCall<Input = unknown, Output = unknown> {
    toolName: string;
    riskLevel: ToolRiskLevel;
    contractVersion: string;
    input: Input;
    output?: Output;
    actor: Actor;
    scope: FiscalScope;
    traceId: string;
    timestamp: string;
    durationMs?: number;
    error?: string;
}
export type ToolContractRegistry = Map<string, ToolContract>;
export declare function createContractRegistry(): ToolContractRegistry;
export declare function registerContract(registry: ToolContractRegistry, contract: ToolContract): void;
export declare function getContract(registry: ToolContractRegistry, name: string): ToolContract;
export interface ContractValidationResult {
    passed: boolean;
    errors: ContractValidationError[];
    warnings: string[];
}
export interface ContractValidationError {
    field: string;
    message: string;
    code: string;
}
export declare function validContractValidation(): ContractValidationResult;
export declare function invalidContractValidation(errors: ContractValidationError[]): ContractValidationResult;
export declare function validateToolCall(contract: ToolContract, call: ToolCall): ContractValidationResult;
export declare function modelSupportsRiskLevel(modelCapabilities: {
    supportsConstrainedOutput: boolean;
    supportsJsonSchema: boolean;
    supportsToolCalling: boolean;
}, level: ToolRiskLevel): boolean;
export declare const DRENYRA_FINANCIAL_TOOL_CONTRACTS: ToolContract[];
export declare function registerDrenyraContracts(): ToolContractRegistry;
//# sourceMappingURL=tool-contract.d.ts.map