import type { WorkspaceLayout } from "../domain/layout";
import type {
	LayoutRepository,
	SaveLayoutResult,
} from "../ports/layout-repository";

// ─── In-Memory Layout Repository ────────────────────────────────────────────

export class InMemoryLayoutRepository implements LayoutRepository {
	private readonly store: Map<string, WorkspaceLayout> = new Map();
	private readonly workspaceIndex: Map<string, string> = new Map();

	async load(layoutId: string): Promise<WorkspaceLayout | null> {
		return this.store.get(layoutId) ?? null;
	}

	async loadByWorkspace(workspaceId: string): Promise<WorkspaceLayout | null> {
		const layoutId = this.workspaceIndex.get(workspaceId);
		if (!layoutId) return null;
		return this.store.get(layoutId) ?? null;
	}

	async save(
		layout: WorkspaceLayout,
		expectedRevision: number,
	): Promise<SaveLayoutResult> {
		const existing = this.store.get(layout.layoutId);

		if (existing && existing.revision !== expectedRevision) {
			return { kind: "conflict", current: existing };
		}

		this.store.set(layout.layoutId, layout);
		this.workspaceIndex.set(layout.workspaceId, layout.layoutId);

		return { kind: "saved", revision: layout.revision };
	}

	async delete(layoutId: string): Promise<void> {
		const layout = this.store.get(layoutId);
		if (layout) {
			this.workspaceIndex.delete(layout.workspaceId);
		}
		this.store.delete(layoutId);
	}
}
