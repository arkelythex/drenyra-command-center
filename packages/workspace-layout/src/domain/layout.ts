import type { LayoutNode } from "./node";
import type { WorkspaceLayoutTemplate } from "./template";

// ─── Current Schema Version ─────────────────────────────────────────────────

export const CURRENT_LAYOUT_SCHEMA_VERSION = 1;

// ─── WorkspaceLayout ────────────────────────────────────────────────────────

export interface WorkspaceLayout {
	readonly schemaVersion: number;
	readonly layoutId: string;
	readonly workspaceId: string;
	readonly ownerId: string;
	readonly template: WorkspaceLayoutTemplate;
	readonly revision: number;
	readonly root: LayoutNode;
	readonly focusedViewId?: string;
	readonly activeWorkstreamId?: string;
	readonly createdAt: string;
	readonly updatedAt: string;
}

// ─── CreateLayoutInput ──────────────────────────────────────────────────────

export interface CreateLayoutInput {
	readonly workspaceId: string;
	readonly ownerId: string;
	readonly template: WorkspaceLayoutTemplate;
	readonly root: LayoutNode;
}

// ─── UpdateLayoutInput ──────────────────────────────────────────────────────

export interface UpdateLayoutInput {
	readonly root?: LayoutNode;
	readonly focusedViewId?: string;
	readonly activeWorkstreamId?: string;
}

// ─── Factories ──────────────────────────────────────────────────────────────

export { createLayout, updateLayout } from "./layout-factory";
