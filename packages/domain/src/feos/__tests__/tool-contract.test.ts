import { describe, expect, it } from "vitest";
import {
  DRENYRA_FINANCIAL_TOOL_CONTRACTS,
  FeosError,
  createContractRegistry,
  getContract,
  modelSupportsRiskLevel,
  registerContract,
  registerDrenyraContracts,
  type ToolCall,
  type ToolContract,
  validateToolCall,
} from "@drenyra/domain";

const actor = { id: "agent-1", type: "agent" as const, label: "Agent" };
const scope = { organizationId: "org-1" as never, companyId: "company-1" as never, companyRuc: "20123456789", fiscalPeriod: "2026-06" };

function contract(riskLevel: ToolContract["riskLevel"]): ToolContract {
  return {
    name: `tool-${riskLevel}`, riskLevel,
    outputMode: riskLevel === "R0" ? "flexible" : riskLevel === "R1" ? "preferred" : "strict",
    description: "Test tool", inputSchema: { type: "object" },
    hasDeterministicValidator: riskLevel === "R2" || riskLevel === "R3",
    requiresApproval: riskLevel === "R3", requiredCapabilities: riskLevel === "R0" || riskLevel === "R1" ? [] : ["test:run"],
    idempotent: true, version: "1.0.0",
  };
}

function call(riskLevel: ToolCall["riskLevel"]): ToolCall {
  return { toolName: "test", riskLevel, contractVersion: "1.0.0", input: {}, actor, scope, traceId: "trace-1", timestamp: "2026-06-01T00:00:00.000Z" };
}

describe("tool contracts", () => {
  it("registers and retrieves contracts while rejecting duplicates", () => {
    const registry = createContractRegistry();
    const r0 = contract("R0");
    registerContract(registry, r0);

    expect(getContract(registry, r0.name)).toBe(r0);
    expect(() => registerContract(registry, r0)).toThrow(FeosError);
    expect(() => getContract(registry, "missing")).toThrow(FeosError);
  });

  it.each(["R0", "R1", "R2", "R3"] as const)("validates a compliant %s call", (riskLevel) => {
    expect(validateToolCall(contract(riskLevel), call(riskLevel))).toEqual({ passed: true, errors: [], warnings: [] });
  });

  it("rejects calls that exceed their contract risk level", () => {
    const result = validateToolCall(contract("R1"), call("R2"));
    expect(result.passed).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({ code: "RISK_LEVEL_EXCEEDED" }));
  });

  it("requires deterministic validation and approval for R3", () => {
    const invalid = { ...contract("R3"), hasDeterministicValidator: false, requiresApproval: false };
    const result = validateToolCall(invalid, call("R3"));
    expect(result.errors.map((error) => error.code)).toEqual(expect.arrayContaining(["R3_MISSING_VALIDATOR", "R3_MISSING_APPROVAL"]));
  });

  it("enforces constrained-output capability requirements by risk", () => {
    const flexibleOnly = { supportsConstrainedOutput: false, supportsJsonSchema: false, supportsToolCalling: false };
    const schemaOnly = { supportsConstrainedOutput: true, supportsJsonSchema: true, supportsToolCalling: false };
    const full = { ...schemaOnly, supportsToolCalling: true };

    expect(modelSupportsRiskLevel(flexibleOnly, "R0")).toBe(true);
    expect(modelSupportsRiskLevel(flexibleOnly, "R1")).toBe(false);
    expect(modelSupportsRiskLevel(schemaOnly, "R2")).toBe(true);
    expect(modelSupportsRiskLevel(schemaOnly, "R3")).toBe(false);
    expect(modelSupportsRiskLevel(full, "R3")).toBe(true);
  });

  it("provides valid predefined financial contracts across all risk levels", () => {
    expect(DRENYRA_FINANCIAL_TOOL_CONTRACTS.map((item) => item.riskLevel)).toEqual(expect.arrayContaining(["R0", "R1", "R2", "R3"]));
    expect(DRENYRA_FINANCIAL_TOOL_CONTRACTS.filter((item) => item.riskLevel === "R3").every((item) => item.hasDeterministicValidator && item.requiresApproval)).toBe(true);
  });

  it("registers every predefined Drenyra contract", () => {
    const registry = registerDrenyraContracts();
    expect(registry.size).toBe(DRENYRA_FINANCIAL_TOOL_CONTRACTS.length);
    expect(getContract(registry, "submit_sire_filing").riskLevel).toBe("R3");
  });
});
