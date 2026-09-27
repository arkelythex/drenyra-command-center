import type { WorkspaceLayout } from "./types";
export declare function serializeLayout(layout: WorkspaceLayout): string;
export declare function deserializeLayout(data: string): WorkspaceLayout | null;
export declare function mergeLayouts(base: WorkspaceLayout, override: Partial<WorkspaceLayout>): WorkspaceLayout;
export declare function isValidLayout(value: unknown): value is WorkspaceLayout;
//# sourceMappingURL=layout-utils.d.ts.map