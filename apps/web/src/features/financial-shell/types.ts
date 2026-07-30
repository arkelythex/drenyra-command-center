// ─── Shell View States ──────────────────────────────────────────────────

export type ShellViewState = "loading" | "ready" | "replaying" | "stale" | "error";

// ─── Shell Context ──────────────────────────────────────────────────────

export interface ShellContext {
  organizationName: string;
  companyName: string;
  fiscalPeriod: string;
  viewState: ShellViewState;
  isLive: boolean;
  isR3: boolean;
}

// ─── Navigation Item ────────────────────────────────────────────────────

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  count?: number;
  isActive?: boolean;
}

// ─── NavSection ─────────────────────────────────────────────────────────

export interface NavSection {
  id: string;
  label: string;
  icon: string;
  items: NavItem[];
  isCollapsed?: boolean;
  count?: number;
  isRunning?: boolean;
}

// ─── Attention Rollup ───────────────────────────────────────────────────

export interface AttentionRollup {
  working: number;
  verifying: number;
  blocked: number;
  approvals: number;
}
