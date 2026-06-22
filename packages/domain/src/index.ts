/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */
export * from "./errors";
export * from "./events";
export * from "./services";
export { DNI } from "./value-objects/DNI";
export { DocumentSeries } from "./value-objects/DocumentSeries";
export { type Currency, Money } from "./value-objects/Money";
export { RUC } from "./value-objects/RUC";
export * from "./fiscal-truth";
export * from "./fiscal-ontology";
export * from "./fiscal-agentic-ledger";
export type {
	ArkelythexProductSurface,
	ArkelythexSurfaceId,
	ArkelythexSurfaceModuleRef,
} from "./types/product-surfaces";
export {
	ARKELYTHEX_PRODUCT_SURFACES,
	getArkelythexProductSurface,
} from "./types/product-surface-registry";
export * from "./platform/mcp";

// --- ACCOUNTING ---
export * from "./accounting";

export * from "./fiscal";
export * from "./fiscal-memory";
export * from "./roi";

export * from "./audit-ledger";

export * from "./entities";
