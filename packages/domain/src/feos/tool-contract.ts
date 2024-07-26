/**
 * FEOS-006 — R0–R3 Strict Tool Contracts
 *
 * Strict schema-based tool contracts with risk-level enforcement.
 * R0/R1 allow flexible sampling, R2 requires strict schemas, R3 requires
 * strict schema + deterministic validation + approval gate.
 *
 * Inspired by Pi 0.82 constrained tool calling capabilities and
 * Gentle-AI exact-candidate review authority patterns.
 *
 * @module @drenyra/domain/feos/tool-contract
 */

import type { Actor, FiscalScope } from "./types";
import { FeosError } from "./types";

// ============================================================================
// Risk Levels
// ============================================================================

export const TOOL_RISK_LEVEL = {
  R0: "R0",   // Read, flexible output. No restrictions.
  R1: "R1",   // Structured output preferred, flexible fallback allowed.
  R2: "R2",   // Strict schema required. Model must support constrained output.
  R3: "R3",   // Strict schema + deterministic validation + explicit approval.
} as const;

export type ToolRiskLevel = (typeof TOOL_RISK_LEVEL)[keyof typeof TOOL_RISK_LEVEL];

/**
 * Risk level ordering. Higher number = more restrictive.
 */
export function riskLevelOrder(level: ToolRiskLevel): number {
  switch (level) {
    case "R0": return 0;
    case "R1": return 1;
    case "R2": return 2;
    case "R3": return 3;
  }
}

export function riskLevelLabel(level: ToolRiskLevel): string {
  switch (level) {
    case "R0": return "Flexible output permitted";
    case "R1": return "Structured output preferred";
    case "R2": return "Strict schema required";
    case "R3": return "Strict schema + deterministic validation + approval";
  }
}

// ============================================================================
// Output Schema Types
// ============================================================================

/**
 * Schema output mode — determines how the output is validated.
 */
export type SchemaOutputMode =
  | "flexible"        // R0: natural language, no schema
  | "preferred"       // R1: structured preferred, flexible fallback
  | "strict"          // R2/R3: must conform to schema
  ;

// ============================================================================
// Tool Contract
// ============================================================================

/**
 * A typed tool contract — the canonical definition of a tool's input/output/shape.
 */
export interface ToolContract {
  /** Canonical tool name (e.g. "post_journal_entry", "prepare_sire_candidate"). */
  name: string;
  /** Risk level of this tool. */
  riskLevel: ToolRiskLevel;
  /** Output mode. */
  outputMode: SchemaOutputMode;
  /** Human-readable description of what the tool does. */
  description: string;
  /** JSON Schema for the input (draft 2020-12 or compatible). */
  inputSchema: Record<string, unknown>;
  /** JSON Schema for the output (optional for R0/R1). */
  outputSchema?: Record<string, unknown>;
  /** Whether the tool has a deterministic validator function. Required for R3. */
  hasDeterministicValidator: boolean;
  /** Whether the tool requires explicit human approval. Required for R3. */
  requiresApproval: boolean;
  /** Required capabilities (e.g. ["sire:submit", "journal:post"]). */
  requiredCapabilities: string[];
  /** Max execution time in ms. */
  timeoutMs?: number;
  /** Whether this tool is idempotent — safe to retry. */
  idempotent: boolean;
  /** Tool version (semver). */
  version: string;
}

// ============================================================================
// Tool Call
// ============================================================================

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

// ============================================================================
// Contract Registry
// ============================================================================

export type ToolContractRegistry = Map<string, ToolContract>;

export function createContractRegistry(): ToolContractRegistry {
  return new Map<string, ToolContract>();
}

export function registerContract(registry: ToolContractRegistry, contract: ToolContract): void {
  if (registry.has(contract.name)) {
    throw new FeosError(
      "DUPLICATE_TOOL_CONTRACT",
      `Tool contract "${contract.name}" is already registered`,
      { toolName: contract.name },
    );
  }
  registry.set(contract.name, contract);
}

export function getContract(registry: ToolContractRegistry, name: string): ToolContract {
  const contract = registry.get(name);
  if (!contract) {
    throw new FeosError(
      "UNKNOWN_TOOL_CONTRACT",
      `No tool contract found for "${name}"`,
      { toolName: name },
    );
  }
  return contract;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Result of a contract validation.
 */
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

export function validContractValidation(): ContractValidationResult {
  return { passed: true, errors: [], warnings: [] };
}

export function invalidContractValidation(errors: ContractValidationError[]): ContractValidationResult {
  return { passed: false, errors, warnings: [] };
}

/**
 * Validate that a tool call conforms to its contract.
 * This is STATIC schema validation — does not run the tool.
 *
 * At R2+, the model MUST be capable of constrained output.
 * At R3+, deterministic validation MUST pass before execution.
 */
export function validateToolCall(
  contract: ToolContract,
  call: ToolCall,
): ContractValidationResult {
  const errors: ContractValidationError[] = [];

  // 1. Risk level enforcement
  if (riskLevelOrder(call.riskLevel) > riskLevelOrder(contract.riskLevel)) {
    errors.push({
      field: "riskLevel",
      message: `Call risk level "${call.riskLevel}" exceeds contract level "${contract.riskLevel}"`,
      code: "RISK_LEVEL_EXCEEDED",
    });
  }

  // 2. R3 requires deterministic validator + approval
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

  // 3. R2/R3 require defined input schema
  if (riskLevelOrder(contract.riskLevel) >= 2) {
    if (!contract.inputSchema || Object.keys(contract.inputSchema).length === 0) {
      errors.push({
        field: "inputSchema",
        message: `R2/R3 tool "${contract.name}" must have a defined input schema`,
        code: "MISSING_INPUT_SCHEMA",
      });
    }
  }

  // 4. Required capabilities must be non-empty for R2+
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

/**
 * Check if a given model/provider supports the output mode required by a risk level.
 * Pi 0.82+ can check this for each model.
 */
export function modelSupportsRiskLevel(
  modelCapabilities: {
    supportsConstrainedOutput: boolean;
    supportsJsonSchema: boolean;
    supportsToolCalling: boolean;
  },
  level: ToolRiskLevel,
): boolean {
  switch (level) {
    case "R0":
      return true; // Any model can do flexible output
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

// ============================================================================
// Predefined Tool Contracts — Drenyra Financial
// ============================================================================

/**
 * Built-in tool contracts for Drenyra financial operations.
 */
export const DRENYRA_FINANCIAL_TOOL_CONTRACTS: ToolContract[] = [
  // ── R0: Read, flexible ─────────────────────────────────────────────────
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

  // ── R1: Structured preferred ────────────────────────────────────────────
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

  // ── R2: Strict schema ──────────────────────────────────────────────────
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

  // ── R3: Strict + Deterministic + Approval ───────────────────────────────
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

/**
 * Register all built-in Drenyra financial tool contracts into a registry.
 */
export function registerDrenyraContracts(): ToolContractRegistry {
  const registry = createContractRegistry();
  for (const contract of DRENYRA_FINANCIAL_TOOL_CONTRACTS) {
    registerContract(registry, contract);
  }
  return registry;
}
