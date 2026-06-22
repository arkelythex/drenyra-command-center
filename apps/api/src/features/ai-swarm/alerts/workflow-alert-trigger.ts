/**
 * Workflow → Consensus Alert Bridge
 *
 * Converts Mastra invoice workflow output into a swarm consensus evaluation.
 * Called AFTER workflow completion when decision !== 'approved'.
 *
 * Agent confidence mapping:
 *   lector    ← invoiceData.extractionConfidence (35% weight in consensus)
 *   validador ← validation.confidence            (40% weight in consensus)
 *   detector  ← arbiterConfidence                (25% weight in consensus)
 *
 * Severity mapping (based on decision + validation errors):
 *   rejected       → critical
 *   manual_review + critical errors → high
 *   manual_review + warnings only  → medium
 */

import { swarmConsensusService } from "@arkelythex/ai/services/swarm-consensus";
import type { AgentConfidence, AlertSeverity } from "@arkelythex/ai/services/swarm-consensus/types";
import type { MastraInvoiceWorkflowOutput } from "../workflows/mastra-invoice-processing.workflow";

const DETECTOR_AGENT_ID = "arbitro-agent";

function resolveSeverity(result: MastraInvoiceWorkflowOutput): AlertSeverity {
  if (result.decision === "rejected") return "critical";

  const hasCriticalErrors = result.validation.errors.some(
    (e) => e.severity === "critical",
  );
  if (hasCriticalErrors) return "high";

  const hasRegularErrors = result.validation.errors.length > 0;
  return hasRegularErrors ? "medium" : "low";
}

function buildAgentConfidences(
  result: MastraInvoiceWorkflowOutput,
): AgentConfidence[] {
  return [
    {
      agentId: "lector-agent",
      agentRole: "lector",
      confidence: result.invoiceData.extractionConfidence,
      reasoning: "Extracción de datos del comprobante",
      timestamp: new Date(),
    },
    {
      agentId: "validador-agent",
      agentRole: "validador",
      confidence: result.validation.confidence,
      reasoning: result.validation.errors
        .map((e) => e.code)
        .join(", ") || "Sin errores detectados",
      timestamp: new Date(),
    },
    {
      agentId: DETECTOR_AGENT_ID,
      agentRole: "detector",
      // Arbiter confidence reflects decision certainty — invert for anomaly detection:
      // high arbiter confidence in rejection = high anomaly confidence
      confidence: result.decision === "approved" ? 0 : result.confidence,
      reasoning: `Decisión: ${result.decision}. ${result.reason}`,
      timestamp: new Date(),
    },
  ];
}

/**
 * WorkflowAlertResult interface.
 *
 * @example
 * ```ts
 * const value: WorkflowAlertResult = {} as WorkflowAlertResult;
 * console.log(value);
 * ```
 */
export interface WorkflowAlertResult {
  alertId: string | null;
  consensusScore: number;
  threshold: number;
  shouldTriggerAlert: boolean;
  severity: AlertSeverity;
}

/**
 * Evaluate and persist a consensus-based anomaly alert for a completed workflow.
 *
 * Fire-and-forget safe: caller should .catch() errors — alert failures
 * must NOT block the SSE response to the client.
 *
 * @param result - Completed workflow output used to compute consensus severity.
 * @param organizationId - Tenant org ID. TODO: inject from auth middleware (Sprint 3).
 * @returns Result of triggerWorkflowConsensusAlert.
 * @example
 * ```ts
 * const result = await triggerWorkflowConsensusAlert({} as MastraInvoiceWorkflowOutput, 0);
 * console.log(result);
 * ```
 */

export async function triggerWorkflowConsensusAlert(
  result: MastraInvoiceWorkflowOutput,
  organizationId: number,
): Promise<WorkflowAlertResult> {
  const severity = resolveSeverity(result);
  const agentConfidences = buildAgentConfidences(result);

  const consensusResult = await swarmConsensusService.calculateConsensus(
    agentConfidences,
    severity,
    organizationId,
  );

  if (!consensusResult.shouldTriggerAlert) {
    return {
      alertId: null,
      consensusScore: consensusResult.consensusScore,
      threshold: consensusResult.threshold,
      shouldTriggerAlert: false,
      severity,
    };
  }

  const alert = await swarmConsensusService.createAlertFromConsensus(
    organizationId,
    "invoice",
    result.documentId,
    `invoice_${result.decision}`,
    severity,
    consensusResult,
    DETECTOR_AGENT_ID,
  );

  return {
    alertId: alert?.id ?? null,
    consensusScore: consensusResult.consensusScore,
    threshold: consensusResult.threshold,
    shouldTriggerAlert: true,
    severity,
  };
}
