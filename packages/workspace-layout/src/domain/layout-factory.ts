import { CURRENT_LAYOUT_SCHEMA_VERSION } from "./layout";
import type {
	WorkspaceLayout,
	CreateLayoutInput,
	UpdateLayoutInput,
} from "./layout";

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateLayoutId(): string {
	if (typeof crypto !== "undefined" && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	return `layout-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ─── Factory ────────────────────────────────────────────────────────────────

export function createLayout(input: CreateLayoutInput): WorkspaceLayout {
	const now = new Date().toISOString();

	return {
		schemaVersion: CURRENT_LAYOUT_SCHEMA_VERSION,
		layoutId: generateLayoutId(),
		workspaceId: input.workspaceId,
		ownerId: input.ownerId,
		template: input.template,
		revision: 1,
		root: input.root,
		createdAt: now,
		updatedAt: now,
	};
}

// ─── Immutable Update ───────────────────────────────────────────────────────

export function updateLayout(
	layout: WorkspaceLayout,
	updates: UpdateLayoutInput,
): WorkspaceLayout {
	const next: WorkspaceLayout = {
		...layout,
		revision: layout.revision + 1,
		updatedAt: new Date().toISOString(),
	};

	if (updates.root !== undefined) {
		(next as { root: typeof updates.root }).root = updates.root;
	}

	if (updates.focusedViewId !== undefined) {
		(next as { focusedViewId?: string }).focusedViewId = updates.focusedViewId;
	}

	if (updates.activeWorkstreamId !== undefined) {
		(next as { activeWorkstreamId?: string }).activeWorkstreamId =
			updates.activeWorkstreamId;
	}

	return next;
}
