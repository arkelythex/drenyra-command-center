import type { Timestamp } from "./types";
export declare const PANE_TYPE: {
    readonly LEDGER: "ledger";
    readonly SIRE: "sire";
    readonly SIRE_DIFF: "sire-diff";
    readonly EVIDENCE: "evidence";
    readonly AGENT_ACTIVITY: "agent-activity";
    readonly APPROVAL: "approval";
    readonly RECONCILIATION: "reconciliation";
    readonly REPORT: "report";
    readonly SKILLS: "skills";
    readonly AUTOMATIONS: "automations";
    readonly ATTENTION: "attention";
    readonly TIMELINE: "timeline";
    readonly DIFF: "diff";
    readonly GENERIC: "generic";
};
export type PaneType = (typeof PANE_TYPE)[keyof typeof PANE_TYPE];
export declare const PANE_POSITION: {
    readonly LEFT: "left";
    readonly CENTER: "center";
    readonly RIGHT: "right";
    readonly BOTTOM: "bottom";
};
export type PanePosition = (typeof PANE_POSITION)[keyof typeof PANE_POSITION];
export declare const DENSITY_MODE: {
    readonly COMFORTABLE: "comfortable";
    readonly DEFAULT: "default";
    readonly COMPACT: "compact";
};
export type DensityMode = (typeof DENSITY_MODE)[keyof typeof DENSITY_MODE];
export interface PaneConfig {
    id: string;
    type: PaneType;
    label: string;
    position: PanePosition;
    size: number;
    minSize: number;
    maxSize?: number;
    resizable: boolean;
    closable: boolean;
    metadata?: Record<string, unknown>;
}
export interface LayoutProps {
    id: string;
    name: string;
    panes: PaneConfig[];
    sidebarCollapsed: boolean;
    rightPanelOpen: boolean;
    densityMode: DensityMode;
    isTemplate: boolean;
    workspaceId?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export declare class Layout {
    private readonly props;
    private constructor();
    static create(input: {
        name: string;
        panes?: PaneConfig[];
        workspaceId?: string;
        isTemplate?: boolean;
    }): Layout;
    static fromProps(props: LayoutProps): Layout;
    get id(): string;
    get panes(): PaneConfig[];
    get densityMode(): DensityMode;
    setDensity(mode: DensityMode): Layout;
    addPane(pane: PaneConfig): Layout;
    removePane(paneId: string): Layout;
    resizePane(paneId: string, newSize: number): Layout;
    toggleSidebar(): Layout;
    toProps(): LayoutProps;
    serialize(): string;
    static deserialize(data: string): Layout;
}
export declare function defaultPanes(): PaneConfig[];
export declare function layoutTemplates(): LayoutProps[];
//# sourceMappingURL=pane-runtime.d.ts.map