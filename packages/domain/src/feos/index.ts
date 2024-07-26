/**
 * FEOS — Financial Engineering OS Core Domain Types
 *
 * Barrel exports for all FEOS domain modules.
 * Framework-free, no external dependencies.
 *
 * @module @drenyra/domain/feos
 */

// Shared types
export type {
  ActorType,
  CompanyId,
  OrganizationId,
  PortfolioId,
  WorkspaceId,
  ChangeSetId,
  EvidenceRootId,
  ReceiptId,
  AttentionId,
  EventId,
  Actor,
  CompanyRef,
  FiscalScope,
  OrganizationRef,
  PeriodRef,
  PortfolioRef,
  Timestamp,
} from "./types";
export {
  FeosError,
  createPeriodRef,
  generateId,
  nowISO,
  nowTimestamp,
} from "./types";

// Workspace (FEOS-001)
export type {
  BlockingInfo,
  PortfolioCompanyView,
  PortfolioRollup,
  PortfolioView,
  WorkspaceIntent,
  WorkspaceProps,
  WorkspaceState,
  WorkspaceStateGroup,
} from "./workspace";
export {
  WORKSPACE_INTENT,
  WORKSPACE_STATE,
  Workspace,
  computePortfolioRollup,
  getStateGroup,
  isWorkspaceHealthy,
  isWorkspaceTerminal,
  isValidTransition,
} from "./workspace";

// Tool Contracts (FEOS-006)
export type {
  ContractValidationError,
  ContractValidationResult,
  SchemaOutputMode,
  ToolCall,
  ToolContract,
  ToolContractRegistry,
  ToolRiskLevel,
} from "./tool-contract";
export {
  DRENYRA_FINANCIAL_TOOL_CONTRACTS,
  TOOL_RISK_LEVEL,
  createContractRegistry,
  getContract,
  modelSupportsRiskLevel,
  registerContract,
  registerDrenyraContracts,
  riskLevelLabel,
  riskLevelOrder,
  validateToolCall,
} from "./tool-contract";

// Agent Events (FEOS-007)
export type {
  AgentEvent,
  AgentEventKind,
  AgentEventStore,
  EventFilter,
  EventProgress,
  EventSeverity,
  WorkflowState,
} from "./agent-event";
export {
  EVENT_SEVERITY,
  createApprovalEvent,
  createToolEvent,
  createWorkflowEvent,
  projectWorkflowState,
} from "./agent-event";

// Evidence Root (FEOS-010)
export type {
  EvidenceCategory,
  EvidenceItem,
  EvidenceRoot,
  EvidenceRootStore,
  FeosReceipt,
} from "./evidence-root";
export {
  EVIDENCE_ROOT_VERSION,
  FEOS_RECEIPT_VERSION,
  computeEvidenceRootHash,
  createEvidenceRoot,
  createFeosReceipt,
  evidenceInRoot,
  hashEvidenceContent,
  verifyEvidenceRoot,
  verifyFeosReceipt,
} from "./evidence-root";

// Attention (FEOS-003)
export type {
  AttentionCategory,
  AttentionInbox,
  AttentionItem,
  AttentionPriority,
  CompanyStatusSummary,
  PortfolioStatus,
} from "./attention";
export {
  buildAttentionInbox,
  buildPortfolioStatus,
  generateAttentionItems,
  sortAttentionItems,
} from "./attention";
