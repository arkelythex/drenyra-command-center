/**
 * FEOS-002 — Persistent Pane and Layout Runtime
 *
 * Runtime for persistent pane layouts with composable panels, resize,
 * templates, and workspace-specific layout persistence.
 *
 * A Pane is a view container (ledger, SIRE, evidence, agent).
 * A Layout is a composition of panes with positions and sizes.
 * A Template is a reusable layout preset.
 *
 * @module @drenyra/domain/feos/pane-runtime
 */

import type { Timestamp } from "./types";
import { generateId, nowTimestamp } from "./types";

// ============================================================================
// Pane Types
// ============================================================================

export const PANE_TYPE = {
  LEDGER: "ledger",
  SIRE: "sire",
  SIRE_DIFF: "sire-diff",
  EVIDENCE: "evidence",
  AGENT_ACTIVITY: "agent-activity",
  APPROVAL: "approval",
  RECONCILIATION: "reconciliation",
  REPORT: "report",
  SKILLS: "skills",
  AUTOMATIONS: "automations",
  ATTENTION: "attention",
  TIMELINE: "timeline",
  DIFF: "diff",
  GENERIC: "generic",
} as const;

export type PaneType = (typeof PANE_TYPE)[keyof typeof PANE_TYPE];

export const PANE_POSITION = { LEFT: "left", CENTER: "center", RIGHT: "right", BOTTOM: "bottom" } as const;
export type PanePosition = (typeof PANE_POSITION)[keyof typeof PANE_POSITION];

export const DENSITY_MODE = { COMFORTABLE: "comfortable", DEFAULT: "default", COMPACT: "compact" } as const;
export type DensityMode = (typeof DENSITY_MODE)[keyof typeof DENSITY_MODE];

export interface PaneConfig {
  id: string;
  type: PaneType;
  label: string;
  position: PanePosition;
  size: number;      // px or flex
  minSize: number;
  maxSize?: number;
  resizable: boolean;
  closable: boolean;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Layout
// ============================================================================

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

export class Layout {
  private constructor(private readonly props: LayoutProps) {
    Object.freeze(this);
  }

  static create(input: {
    name: string;
    panes?: PaneConfig[];
    workspaceId?: string;
    isTemplate?: boolean;
  }): Layout {
    return new Layout({
      id: generateId(),
      name: input.name,
      panes: input.panes ?? defaultPanes(),
      sidebarCollapsed: false,
      rightPanelOpen: true,
      densityMode: "default",
      isTemplate: input.isTemplate ?? false,
      workspaceId: input.workspaceId,
      createdAt: nowTimestamp(),
      updatedAt: nowTimestamp(),
    });
  }

  static fromProps(props: LayoutProps): Layout {
    return new Layout(props);
  }

  get id(): string { return this.props.id; }
  get panes(): PaneConfig[] { return this.props.panes; }
  get densityMode(): DensityMode { return this.props.densityMode; }

  setDensity(mode: DensityMode): Layout {
    return new Layout({ ...this.props, densityMode: mode, updatedAt: nowTimestamp() });
  }

  addPane(pane: PaneConfig): Layout {
    return new Layout({ ...this.props, panes: [...this.props.panes, pane], updatedAt: nowTimestamp() });
  }

  removePane(paneId: string): Layout {
    return new Layout({ ...this.props, panes: this.props.panes.filter((p) => p.id !== paneId), updatedAt: nowTimestamp() });
  }

  resizePane(paneId: string, newSize: number): Layout {
    return new Layout({
      ...this.props,
      panes: this.props.panes.map((p) => p.id === paneId ? { ...p, size: newSize } : p),
      updatedAt: nowTimestamp(),
    });
  }

  toggleSidebar(): Layout {
    return new Layout({ ...this.props, sidebarCollapsed: !this.props.sidebarCollapsed, updatedAt: nowTimestamp() });
  }

  toProps(): LayoutProps {
    return { ...this.props };
  }

  /** Serialize for localStorage persistence. */
  serialize(): string {
    return JSON.stringify(this.props);
  }

  /** Deserialize from localStorage. */
  static deserialize(data: string): Layout {
    return Layout.fromProps(JSON.parse(data));
  }
}

// ============================================================================
// Defaults
// ============================================================================

export function defaultPanes(): PaneConfig[] {
  return [
    { id: generateId(), type: "generic", label: "Sidebar", position: "left", size: 260, minSize: 64, resizable: true, closable: false },
    { id: generateId(), type: "generic", label: "Main", position: "center", size: 600, minSize: 400, resizable: true, closable: false },
    { id: generateId(), type: "generic", label: "Right Panel", position: "right", size: 420, minSize: 300, resizable: true, closable: true },
  ];
}

export function layoutTemplates(): LayoutProps[] {
  return [
    Layout.create({ name: "Monthly Close", isTemplate: true, panes: [
      { id: generateId(), type: "ledger", label: "Ledger", position: "left", size: 300, minSize: 200, resizable: true, closable: false },
      { id: generateId(), type: "generic", label: "Close Checklist", position: "center", size: 600, minSize: 400, resizable: true, closable: false },
      { id: generateId(), type: "approval", label: "Approvals", position: "right", size: 420, minSize: 300, resizable: true, closable: true },
      { id: generateId(), type: "attention", label: "Attention", position: "bottom", size: 200, minSize: 100, resizable: true, closable: true },
    ] }).toProps(),
    Layout.create({ name: "SIRE Review", isTemplate: true, panes: [
      { id: generateId(), type: "sire", label: "SIRE Books", position: "left", size: 300, minSize: 200, resizable: true, closable: false },
      { id: generateId(), type: "sire-diff", label: "SIRE Diff", position: "center", size: 600, minSize: 400, resizable: true, closable: false },
      { id: generateId(), type: "evidence", label: "Evidence", position: "right", size: 420, minSize: 300, resizable: true, closable: true },
    ] }).toProps(),
    Layout.create({ name: "Bank Reconciliation", isTemplate: true, panes: [
      { id: generateId(), type: "reconciliation", label: "Reconciliation", position: "center", size: 800, minSize: 400, resizable: true, closable: false },
      { id: generateId(), type: "evidence", label: "Documents", position: "right", size: 400, minSize: 300, resizable: true, closable: true },
    ] }).toProps(),
  ];
}
