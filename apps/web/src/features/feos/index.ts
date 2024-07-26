/**
 * FEOS — Web Feature Module
 *
 * Barrel exports for the FEOS workspace and attention UI integration.
 */

// API
export {
  createWorkspace,
  listWorkspaces,
  getWorkspace,
  transitionWorkspace,
  getPortfolioStatus,
  getAttentionInbox,
  listToolContracts,
  validateToolCall,
  getWorkspaceEvents,
  getWorkflowState,
  computeEvidenceRoot,
  verifyEvidenceRoot,
  createReceipt,
  verifyReceipt,
} from "./api/feos.api";

// Hooks
export { useWorkspaceCreate, useWorkspaceList, useWorkspaceTransition } from "./hooks/useFeosWorkspace";
export { useAttentionInbox, usePortfolioStatus } from "./hooks/useFeosAttention";

// Components
export { FeosWorkspaceDashboard } from "./components/FeosWorkspaceDashboard";
export { FeosAttentionInbox } from "./components/FeosAttentionInbox";
