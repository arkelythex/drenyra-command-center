/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */

// --- ACCOUNTING ---
export * from "./accounting";
export * from "./audit-ledger";
// --- FISCAL SEAMS (Phase 1) ---
export * from "./country-pack";
export type {
	ApprovalRequestProps,
	DiffChange,
	DiffStatus,
} from "./entities";
export * from "./entities";
export { ApprovalRequest, EvidenceItem } from "./entities";
export * from "./errors";
export * from "./events";
// --- FEOS CORE (Financial Engineering OS) ---
export * from "./feos";
export {
	createPeriodRef as feosCreatePeriodRef,
	DENSITY_MODE as FEOS_DENSITY_MODE,
	PANE_POSITION as FEOS_PANE_POSITION,
	PANE_TYPE as FEOS_PANE_TYPE,
	WORKSPACE_INTENT as FEOS_WORKSPACE_INTENT,
	Workspace,
} from "./feos";
export * from "./fiscal";
// --- FISCAL CONTRACTS (Cross-stack source of truth) ---
export * from "./fiscal-contracts";
export * from "./fiscal-memory";
export type { FiscalPeriod } from "./fiscal-ontology";
export * from "./fiscal-ontology";
export * from "./fiscal-truth";
export * from "./services";
export type {
	CountryCode,
	TaxIdentifier,
	TaxIdentifierType,
} from "./types/tax-identifier";
export { DNI } from "./value-objects/DNI";
export { DocumentSeries } from "./value-objects/DocumentSeries";
export { type Currency, Money } from "./value-objects/Money";
export { RUC } from "./value-objects/RUC";
export type {
	CompanyRef,
	DensityMode,
	OrganizationRef,
	PaneConfig,
	PanePosition,
	PaneType,
	PeriodRef,
	PortfolioRef,
	WorkspaceId,
	WorkspaceIntent,
} from "./workbench";
export * from "./workbench";
// Names exported by several star-exports are ambiguous: ES drops them (runtime
// `undefined`) and TS resolves them inconsistently. Each is pinned explicitly:
// the plain name keeps its pre-FEOS owner, the FEOS variant gets a prefixed alias.
export {
	createPeriodRef,
	DENSITY_MODE,
	PANE_POSITION,
	PANE_TYPE,
	WORKSPACE_INTENT,
} from "./workbench";
