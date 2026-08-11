// ─── DTOs ───────────────────────────────────────────────────────────

export * from "./drenyra";
export * from "./dtos/ai-context-control-plane/context-policy.dto";
export * from "./dtos/ai-context-control-plane/context-registry.dto";
export * from "./dtos/ai-context-control-plane/context-run.dto";
export * from "./dtos/ai-context-control-plane/context-trace.dto";
export * from "./dtos/ai-context-control-plane/evaluation.dto";
export * from "./dtos/ai-control-plane/contracts.dto";
// ─── Feature Type Barrels ──────────────────────────────────────────
export * from "./features/accounting-prs";
export * from "./features/api-marketplace";
export * from "./features/automation-studio";
export * from "./features/cfo-analytics";
export * from "./features/client-comms";
export * from "./features/doctor-mode";
export * from "./features/evidence";
export * from "./features/judgment-day";
export * from "./features/monthly-close";
export * from "./features/rag-enterprise";
export * from "./features/sire-comparison";
// ─── Domain Modules ────────────────────────────────────────────────
export * from "./fiscal-truth";
export * from "./ports/ai-provider.port";
export * from "./ports/document-processing.port";
// ─── Ports ─────────────────────────────────────────────────────────
// TenantScope is exported by both the context-registry DTO (string union)
// and storage.port (interface). The storage.port shape matches the
// `@drenyra/domain/scope` contract consumers use, so it wins explicitly.
export { TenantScope } from "./ports/storage.port";
export * from "./ports/storage.port";
export * from "./ports/tax-authority.port";
// ─── Services ──────────────────────────────────────────────────────
export * from "./services/fiscal-memory.service";
export * from "./services/recurring-error.service";
export {
	CorrectionUseCase,
	FiscalNightlyRunUseCase,
} from "./use-cases/fiscal-agent/fiscal-nightly-run.use-case";
// ─── Use Cases ───────────────────────────────────────────────────────
export * from "./use-cases/fiscal-agent/types";
