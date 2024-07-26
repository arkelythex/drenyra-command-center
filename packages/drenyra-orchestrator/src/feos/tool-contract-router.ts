/**
 * Drenyra Orchestrator — FEOS R0-R3 Tool Contract Router
 *
 * Routes tool calls through the risk-level pipeline:
 * R0: execute directly (flexible output)
 * R1: prefer structured, fallback to flexible
 * R2: enforce strict schema, validate before execute
 * R3: enforce strict schema + deterministic validation + require approval
 *
 * @module @drenyra/orchestrator/feos/tool-contract-router
 */

import type {
  ToolCall,
  ToolContract,
  ToolContractRegistry,
  ToolRiskLevel,
  ContractValidationResult,
} from "@drenyra/domain";
import {
  validateToolCall,
  riskLevelOrder,
} from "@drenyra/domain";
import { FeosError } from "@drenyra/domain";

// ============================================================================
// Routing Decision
// ============================================================================

export type ToolRouteAction =
  | { action: "execute_directly" }
  | { action: "prefer_structured" }
  | { action: "enforce_schema"; validation: ContractValidationResult }
  | { action: "require_approval"; validation: ContractValidationResult; approvalRequest: ApprovalRequest }
  | { action: "rejected"; reason: string }
  ;

export interface ApprovalRequest {
  toolName: string;
  toolLabel: string;
  inputSummary: string;
  requestedBy: string;
  scope: {
    organizationId: string;
    companyId: string;
    companyRuc: string;
    period: string;
  };
  riskLevel: ToolRiskLevel;
  traceId: string;
  timestamp: string;
}

// ============================================================================
// Route Context
// ============================================================================

export interface ToolRouteContext {
  registry: ToolContractRegistry;
  modelCapabilities?: {
    supportsConstrainedOutput: boolean;
    supportsJsonSchema: boolean;
    supportsToolCalling: boolean;
  };
  approvalCheck?: (request: ApprovalRequest) => Promise<boolean>;
}

// ============================================================================
// Router
// ============================================================================

/**
 * Route a tool call through the FEOS risk-level pipeline.
 *
 * Returns the action to take: execute, prefer structured, enforce schema,
 * require approval, or reject.
 */
export async function routeToolCall(
  call: ToolCall,
  ctx: ToolRouteContext,
): Promise<ToolRouteAction> {
  // 1. Look up contract
  const contract = ctx.registry.get(call.toolName);
  if (!contract) {
    return { action: "rejected", reason: `Unknown tool: "${call.toolName}"` };
  }

  // 2. Basic validation
  const validation = validateToolCall(contract, call);
  if (!validation.passed) {
    return {
      action: "rejected",
      reason: `Tool contract validation failed: ${validation.errors.map(e => e.message).join("; ")}`,
    };
  }

  // 3. Check model capabilities for R2+
  if (
    ctx.modelCapabilities &&
    riskLevelOrder(contract.riskLevel) >= 2
  ) {
    const canEnforce =
      (contract.riskLevel === "R2" || contract.riskLevel === "R3") &&
      ctx.modelCapabilities.supportsConstrainedOutput &&
      ctx.modelCapabilities.supportsJsonSchema;

    if (!canEnforce) {
      return {
        action: "rejected",
        reason: `Model does not support constrained output required for R${riskLevelOrder(contract.riskLevel)} tool "${contract.name}"`,
      };
    }
  }

  // 4. Route by risk level
  switch (contract.riskLevel) {
    case "R0":
      return { action: "execute_directly" };

    case "R1":
      return { action: "prefer_structured" };

    case "R2": {
      // Schema enforcement is done by validateToolCall above
      return {
        action: "enforce_schema",
        validation,
      };
    }

    case "R3": {
      // R3: schema + deterministic validator + approval
      if (!contract.hasDeterministicValidator) {
        return {
          action: "rejected",
          reason: `R3 tool "${contract.name}" requires a deterministic validator but none is registered`,
        };
      }

      if (!contract.requiresApproval) {
        return {
          action: "rejected",
          reason: `R3 tool "${contract.name}" requires explicit approval but none is configured`,
        };
      }

      // Create approval request
      const approvalRequest: ApprovalRequest = {
        toolName: contract.name,
        toolLabel: contract.description,
        inputSummary: JSON.stringify(call.input).slice(0, 500),
        requestedBy: call.actor.label,
        scope: {
          organizationId: call.scope.organizationId,
          companyId: call.scope.companyId,
          companyRuc: call.scope.companyRuc,
          period: call.scope.fiscalPeriod,
        },
        riskLevel: "R3",
        traceId: call.traceId,
        timestamp: call.timestamp,
      };

      // Check if approval is already granted
      if (ctx.approvalCheck) {
        const approved = await ctx.approvalCheck(approvalRequest);
        if (!approved) {
          return {
            action: "require_approval",
            validation,
            approvalRequest,
          };
        }
      }

      return {
        action: "enforce_schema",
        validation,
      };
    }

    default:
      return { action: "rejected", reason: `Unknown risk level: ${contract.riskLevel}` };
  }
}

/**
 * Check if a tool call can be executed inline (R0/R1) or requires routing (R2/R3).
 */
export function requiresRouting(riskLevel: ToolRiskLevel): boolean {
  return riskLevelOrder(riskLevel) >= 2;
}

/**
 * Check if a tool call requires human approval (R3 only).
 */
export function requiresApproval(riskLevel: ToolRiskLevel): boolean {
  return riskLevel === "R3";
}
