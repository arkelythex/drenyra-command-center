// ─── Domain ─────────────────────────────────────────────────────────────────
export {
	LayoutError,
	LayoutNotFoundError,
	LayoutValidationError,
	LayoutConflictError,
	LayoutSchemaVersionError,
	LayoutMigrationError,
	type LayoutErrorCode,
} from "./domain/errors";

export {
	type LayoutNode,
	type SplitLayoutNode,
	type TabGroupLayoutNode,
	type ViewLayoutNode,
	type SplitDirection,
	createSplitLayoutNode,
	createTabGroupLayoutNode,
	createViewLayoutNode,
	getAllViewIds,
} from "./domain/node";

export {
	WORKSPACE_LAYOUT_TEMPLATE,
	type WorkspaceLayoutTemplate,
} from "./domain/template";

export {
	CURRENT_LAYOUT_SCHEMA_VERSION,
	type WorkspaceLayout,
	type CreateLayoutInput,
	type UpdateLayoutInput,
} from "./domain/layout";

export { createLayout, updateLayout } from "./domain/layout-factory";

export {
	type LayoutMigration,
	applyLayoutMigrations,
} from "./domain/migration";

// ─── Templates ──────────────────────────────────────────────────────────────
export {
	portfolioOperationsLayout,
	monthlyCloseLayout,
	sireReviewLayout,
	bankReconciliationLayout,
	evidenceAuditLayout,
} from "./templates";

// ─── Application ────────────────────────────────────────────────────────────
export { createWorkspaceLayout } from "./application/create-layout";
export { updateWorkspaceLayout } from "./application/update-layout";
export {
	restoreLayoutCheck,
	type RestoreValidationResult,
	type RestoreWarning,
} from "./application/restore-layout";
export { migrateLayout } from "./application/migrate-layout";

// ─── Ports ──────────────────────────────────────────────────────────────────
export type {
	LayoutRepository,
	SaveLayoutResult,
} from "./ports/layout-repository";

// ─── Adapters ───────────────────────────────────────────────────────────────
export { InMemoryLayoutRepository } from "./adapters/memory-layout-repository";
