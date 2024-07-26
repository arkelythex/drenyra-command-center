/**
 * FEOS — API Client
 *
 * Type-safe API client for FEOS endpoints following the Drenyra web pattern.
 * Uses Eden Treaty + safeApiCall + extractOkDataOrPassthrough.
 */

import { api } from "@/lib/api";
import { safeApiCall } from "@/lib/api-factory";
import { extractOkDataOrPassthrough, unwrap } from "@/lib/api-helpers";

// Eden path: prefix "/api/v1/feos" → api.api.v1.feos.*
const feos = () => api.api.v1.feos;

// ============================================================================
// Workspace
// ============================================================================

export function createWorkspace(input: {
  organizationId: string;
  companyId: string;
  companyRuc: string;
  period: { year: number; month: number };
  intent: string;
  label: string;
  description?: string;
  createdBy: { id: string; type: string; label: string };
}) {
  return safeApiCall(async () =>
    extractOkDataOrPassthrough(
      await unwrap(feos().workspaces.post(input)),
      "Failed to create workspace",
    ),
  );
}

export function listWorkspaces(companyId?: string) {
  return safeApiCall(async () =>
    extractOkDataOrPassthrough(
      await unwrap(feos().workspaces.get(companyId ? { query: { companyId } } : undefined)),
      "Failed to list workspaces",
    ),
  );
}

export function getWorkspace(id: string) {
  return safeApiCall(async () =>
    extractOkDataOrPassthrough(
      await unwrap(feos().workspaces({ id }).get()),
      "Failed to get workspace",
    ),
  );
}

export function transitionWorkspace(id: string, action: string, params?: Record<string, unknown>) {
  return safeApiCall(async () =>
    extractOkDataOrPassthrough(
      await unwrap(feos().workspaces({ id }).transition.post({ action, params })),
      "Failed to transition workspace",
    ),
  );
}

// ============================================================================
// Portfolio & Attention
// ============================================================================

export function getPortfolioStatus(organizationId: string) {
  return safeApiCall(async () =>
    extractOkDataOrPassthrough(
      await unwrap(feos().portfolio({ organizationId }).get()),
      "Failed to get portfolio status",
    ),
  );
}

export function getAttentionInbox(organizationId: string) {
  return safeApiCall(async () =>
    extractOkDataOrPassthrough(
      await unwrap(feos().attention({ organizationId }).get()),
      "Failed to get attention inbox",
    ),
  );
}

// ============================================================================
// Tool Contracts
// ============================================================================

export function listToolContracts() {
  return safeApiCall(async () =>
    extractOkDataOrPassthrough(
      await unwrap(feos()["tool-contracts"].get()),
      "Failed to list tool contracts",
    ),
  );
}

export function validateToolCall(toolName: string, riskLevel: string) {
  return safeApiCall(async () =>
    extractOkDataOrPassthrough(
      await unwrap(feos()["tool-contracts"].validate.post({ toolName, riskLevel })),
      "Failed to validate tool call",
    ),
  );
}

// ============================================================================
// Agent Events
// ============================================================================

export function getWorkspaceEvents(workspaceId: string) {
  return safeApiCall(async () =>
    extractOkDataOrPassthrough(
      await unwrap(feos().events.workspace({ workspaceId }).get()),
      "Failed to get workspace events",
    ),
  );
}

export function getWorkflowState(workspaceId: string) {
  return safeApiCall(async () =>
    extractOkDataOrPassthrough(
      await unwrap(feos().workflow({ workspaceId }).get()),
      "Failed to get workflow state",
    ),
  );
}

// ============================================================================
// Evidence Root & Receipts
// ============================================================================

export function computeEvidenceRoot(items: Array<{ id: string; category: string; title: string; hash: string; timestamp: string }>) {
  return safeApiCall(async () =>
    extractOkDataOrPassthrough(
      await unwrap(feos()["evidence-root"].post({ items })),
      "Failed to compute evidence root",
    ),
  );
}

export function verifyEvidenceRoot(id: string) {
  return safeApiCall(async () =>
    extractOkDataOrPassthrough(
      await unwrap(feos()["evidence-root"]({ id }).verify.get()),
      "Failed to verify evidence root",
    ),
  );
}

export function createReceipt(input: {
  action: string;
  actor: { id: string; type: string; label: string };
  scope: { organizationId: string; companyId: string; companyRuc: string; fiscalPeriod: string };
  evidenceItems: Array<{ id: string; category: string; title: string; hash: string; timestamp: string }>;
  actionInput: unknown;
  actionOutput: unknown;
}) {
  return safeApiCall(async () =>
    extractOkDataOrPassthrough(
      await unwrap(feos().receipts.post(input)),
      "Failed to create receipt",
    ),
  );
}

export function verifyReceipt(receipt: unknown) {
  return safeApiCall(async () =>
    extractOkDataOrPassthrough(
      await unwrap(feos().receipts.verify.post(receipt)),
      "Failed to verify receipt",
    ),
  );
}
