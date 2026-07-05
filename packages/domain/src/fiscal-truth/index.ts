/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */
export * from "./constants";
export * from "./entities/EvidenceEdge";
export * from "./entities/EvidenceNode";
export * from "./entities/FiscalTruthEvent";
export * from "./expediente-fiscal";
export * from "./fiscal-pipeline";
export * from "./ontology";
export * from "./repositories/evidence-graph.repository";
export * from "./repositories/fiscal-truth.repository";
export * from "./repositories/replay.repository";
export * from "./rule-set";
export * from "./types";
