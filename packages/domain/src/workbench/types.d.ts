export type WorkspaceId = string & {
    readonly __brand: "WorkspaceId";
};
export type PaneId = string & {
    readonly __brand: "PaneId";
};
export interface OrganizationRef {
    id: string;
    name: string;
    slug: string;
}
export interface PortfolioRef {
    id: string;
    name: string;
    organizationId: string;
}
export interface CompanyRef {
    id: string;
    name: string;
    ruc: string;
    organizationId: string;
}
export interface PeriodRef {
    year: number;
    month: number;
    label: string;
}
export declare const WORKSPACE_INTENT: {
    readonly CLOSE: "close";
    readonly RECONCILE: "reconcile";
    readonly REVIEW: "review";
    readonly INVESTIGATE: "investigate";
    readonly CONFIGURE: "configure";
    readonly REPORT: "report";
};
export type WorkspaceIntent = (typeof WORKSPACE_INTENT)[keyof typeof WORKSPACE_INTENT];
export declare const DENSITY_MODE: {
    readonly COMFORTABLE: "comfortable";
    readonly DEFAULT: "default";
    readonly COMPACT: "compact";
};
export type DensityMode = (typeof DENSITY_MODE)[keyof typeof DENSITY_MODE];
export declare const PANE_TYPE: {
    readonly LEDGER: "ledger";
    readonly SIRE_DIFF: "sire-diff";
    readonly EVIDENCE: "evidence";
    readonly AGENT_ACTIVITY: "agent-activity";
    readonly SIAR: "siar";
    readonly APPROVAL: "approval";
    readonly RECONCILIATION: "reconciliation";
    readonly REPORT: "report";
    readonly GENERIC: "generic";
};
export type PaneType = (typeof PANE_TYPE)[keyof typeof PANE_TYPE];
export declare const PANE_POSITION: {
    readonly LEFT: "left";
    readonly CENTER: "center";
    readonly RIGHT: "right";
};
export type PanePosition = (typeof PANE_POSITION)[keyof typeof PANE_POSITION];
export interface PaneConfig {
    id: PaneId;
    type: PaneType;
    label: string;
    position: PanePosition;
    size: number;
    minSize: number;
    metadata?: Record<string, unknown>;
}
export interface WorkspaceLayout {
    panes: PaneConfig[];
    sidebarCollapsed: boolean;
    rightPanelOpen: boolean;
    densityMode: DensityMode;
}
export interface Workspace {
    id: WorkspaceId;
    company: CompanyRef;
    period: PeriodRef;
    intent: WorkspaceIntent;
    label: string;
    layout: WorkspaceLayout;
}
export declare function createWorkspaceId(): WorkspaceId;
export declare function createPaneId(): PaneId;
export declare function createPeriodRef(year: number, month: number): PeriodRef;
export declare function createCompanyRef(id: string, name: string, ruc: string, organizationId: string): CompanyRef;
export declare function validatePaneConfig(config: PaneConfig): boolean;
export declare function defaultPaneConfigs(): PaneConfig[];
export declare function defaultWorkspaceLayout(): WorkspaceLayout;
//# sourceMappingURL=types.d.ts.map