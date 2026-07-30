import type { WorkspaceLayout } from "../domain/layout";

// ─── Save Result ────────────────────────────────────────────────────────────

export type SaveLayoutResult =
	| { kind: "saved"; revision: number }
	| { kind: "conflict"; current: WorkspaceLayout };

// ─── Layout Repository Port ─────────────────────────────────────────────────

export interface LayoutRepository {
	load(layoutId: string): Promise<WorkspaceLayout | null>;
	loadByWorkspace(workspaceId: string): Promise<WorkspaceLayout | null>;
	save(
		layout: WorkspaceLayout,
		expectedRevision: number,
	): Promise<SaveLayoutResult>;
	delete(layoutId: string): Promise<void>;
}
