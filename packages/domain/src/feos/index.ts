/**
 * FEOS — Financial Engineering OS Core Domain Types
 *
 * Barrel exports for all FEOS domain modules.
 * Framework-free, no external dependencies.
 *
 * @module @drenyra/domain/feos
 */

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
	createApprovalEvent,
	createToolEvent,
	createWorkflowEvent,
	EVENT_SEVERITY,
	projectWorkflowState,
} from "./agent-event";
// Approval (FEOS-008)
export type {
	ApprovalFilter,
	ApprovalPolicy,
	ApprovalRequestProps,
	ApprovalStatus,
	ApprovalStep,
	PolicyRuleType,
} from "./approval";
export {
	APPROVAL_STATUS,
	ApprovalRequest,
	DRENYRA_DEFAULT_POLICIES,
	evaluatePolicies,
} from "./approval";
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
// Change Set (FEOS-004)
export type {
	ChangeEntry,
	ChangeEntryType,
	ChangeSetProps,
	ChangeSetStatus,
} from "./change-set";
export {
	CHANGE_SET_STATUS,
	ChangeSet,
	isValidCSTransition,
} from "./change-set";
// Connector Framework (FEOS-015)
export type {
	ConnectorAuthType,
	ConnectorCategory,
	ConnectorContract,
	ConnectorHealth,
	ConnectorOperation,
	ConnectorStatus,
} from "./connector-framework";
export {
	ConnectorRegistry,
	DRENYRA_CONNECTORS,
} from "./connector-framework";
// Country Runtime (FEOS-014)
export type {
	CountryPackDef,
	FiscalPeriod,
	TaxDeadline,
	TaxRule,
} from "./country-runtime";
export {
	COLOMBIA_TAX_RULES,
	CountryRuntime,
	DRENYRA_COUNTRY_PACKS,
	PERU_TAX_RULES,
} from "./country-runtime";
// Degraded Operations (FEOS-017)
export type {
	CapabilityStatus,
	CircuitBreakerConfig,
	CircuitBreakerState,
	CircuitState,
	DegradedModeConfig,
	DegradedModeStore,
	ServiceHealth,
	ServiceStatus,
	UnknownStateResolution,
} from "./degraded";
export {
	CircuitBreaker,
	DEFAULT_CIRCUIT_BREAKER,
	generateRecoveryPlan,
} from "./degraded";

// Financial Diff (FEOS-009)
export type {
	DiffCategory,
	DiffChange,
	DiffFilter,
	DiffReview,
	DiffRiskFactor,
	DiffRiskScore,
	DiffSeverity,
	DiffStatus,
	FinancialDiffProps,
	FinancialImpact,
} from "./diff";
export {
	computeDiffRiskScore,
	computeSeverity,
	FinancialDiff,
	isValidDiffTransition,
} from "./diff";
// Evidence Root (FEOS-010)
export type {
	EvidenceCategory,
	EvidenceItem,
	EvidenceRoot,
	EvidenceRootStore,
	FeosReceipt,
} from "./evidence-root";
export {
	computeEvidenceRootHash,
	createEvidenceRoot,
	createFeosReceipt,
	EVIDENCE_ROOT_VERSION,
	evidenceInRoot,
	FEOS_RECEIPT_VERSION,
	hashEvidenceContent,
	verifyEvidenceRoot,
	verifyFeosReceipt,
} from "./evidence-root";
// Mobile Supervision (FEOS-013)
export type {
	MobileApprovalAction,
	MobileCompanySummary,
	MobileNotification,
	NotificationPriority,
	SupervisorDashboard,
} from "./mobile-supervision";
export { MobileSupervision } from "./mobile-supervision";
// Model Routing (FEOS-012)
export type {
	AIProvider,
	CostBudget,
	CostEntry,
	ModelCapabilities,
	ModelEntry,
	ModelPricing,
	ModelTier,
	RoutingDecision,
} from "./model-routing";
export {
	DRENYRA_MODEL_REGISTRY,
	ModelRouter,
} from "./model-routing";

// Pane Runtime (FEOS-002)
export type {
	DensityMode,
	LayoutProps,
	PaneConfig,
	PanePosition,
	PaneType,
} from "./pane-runtime";
export {
	DENSITY_MODE,
	defaultPanes,
	Layout,
	layoutTemplates,
	PANE_POSITION,
	PANE_TYPE,
} from "./pane-runtime";
// Performance Budget (FEOS-016)
export type {
	BudgetCategory,
	PerfBudget,
	PerfMeasurement,
} from "./performance-budget";
export {
	DRENYRA_PERF_BUDGETS,
	PerfBudgetTracker,
} from "./performance-budget";
// Product Telemetry (FEOS-018)
export type {
	CostMetric,
	TelemetryCategory,
	TelemetryEvent,
	UsageMetric,
} from "./product-telemetry";
export {
	emptyCostMetrics,
	TelemetryStore,
} from "./product-telemetry";
// Skills & Automation (FEOS-011)
export type {
	AutomationProps,
	AutomationStatus,
	AutomationStore,
	AutomationTrigger,
	AutomationTriggerType,
	SkillExecutionMode,
	SkillFilter,
	SkillRegistryEntry,
	SkillsRegistry,
} from "./skills-registry";
export { Automation } from "./skills-registry";
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
	createContractRegistry,
	DRENYRA_FINANCIAL_TOOL_CONTRACTS,
	getContract,
	modelSupportsRiskLevel,
	registerContract,
	registerDrenyraContracts,
	riskLevelLabel,
	riskLevelOrder,
	TOOL_RISK_LEVEL,
	validateToolCall,
} from "./tool-contract";
// Shared types
export type {
	Actor,
	ActorType,
	AttentionId,
	ChangeSetId,
	CompanyId,
	CompanyRef,
	EventId,
	EvidenceRootId,
	FiscalScope,
	OrganizationId,
	OrganizationRef,
	PeriodRef,
	PortfolioId,
	PortfolioRef,
	ReceiptId,
	Timestamp,
	WorkspaceId,
} from "./types";
export {
	createPeriodRef,
	FeosError,
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
	computePortfolioRollup,
	getStateGroup,
	isValidTransition,
	isWorkspaceHealthy,
	isWorkspaceTerminal,
	WORKSPACE_INTENT,
	WORKSPACE_STATE,
	Workspace,
} from "./workspace";
