"use client";

/**
 * RightPanel — right sidebar that auto-switches between diff, artifact,
 * reports, KPI dashboard, and thread details views.
 *
 * Views are loaded from co-located modules:
 *   - RightPanel.diff-view.tsx       (DiffView)
 *   - RightPanel.artifact-panel.tsx  (ContextPanel)
 *   - RightPanel.details-tab.tsx     (DetailsTab)
 *   - ReportPreview.tsx, KpiDashboard.tsx (standalone)
 */

import { useState, useMemo } from "react";
import { Pin, PinOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDiffApprovalStore } from "@/stores/diff-approval-store";
import { useArtifactStore } from "@/stores/artifact-store";
import { useAccountingStore } from "@/stores/accounting-store";
import { ReportPreview } from "./ReportPreview";
import { KpiDashboard } from "./KpiDashboard";
import { DiffView } from "./RightPanel.diff-view";
import { ContextPanel } from "./RightPanel.artifact-panel";
import { DetailsTab } from "./RightPanel.details-tab";

// ─── View types ───────────────────────────────────────────────────────────────

type ViewType = "diff" | "artifact" | "reports" | "kpi" | "details";

const VIEW_LABELS: Record<ViewType, string> = {
  diff: "Conciliación",
  artifact: "Previsualización",
  reports: "Reportes",
  kpi: "Dashboard KPI",
  details: "Detalles",
};

// ─── Main component ───────────────────────────────────────────────────────────

export function RightPanel() {
  const pinnedArtifacts = useArtifactStore((s) => s.pinnedArtifacts);
  const diffFiles = useDiffApprovalStore((s) => s.diffFiles);
  const financialReports = useAccountingStore((s) => s.financialReports);
  const [lockedView, setLockedView] = useState<ViewType | null>(null);

  const currentView: ViewType = useMemo(() => {
    if (lockedView) return lockedView;
    if (pinnedArtifacts.length > 0) return "artifact";
    if (diffFiles.length > 0) return "diff";
    if (financialReports.length > 0) return "reports";
    return "kpi";
  }, [lockedView, pinnedArtifacts.length, diffFiles.length, financialReports.length]);

  const isLocked = lockedView !== null;

  return (
    <aside className="flex h-full w-[480px] max-xl:w-full max-xl:max-w-[480px] flex-col border-l border-[var(--border-subtle)] bg-[var(--surface-1)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface-2)]/50 px-4 py-2.5">
        <h2 className="text-xs font-semibold text-[var(--text-primary)]">
          {VIEW_LABELS[currentView]}
        </h2>
        <button
          onClick={() => setLockedView(isLocked ? null : currentView)}
          className={cn(
            "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors",
            isLocked
              ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
              : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)]",
          )}
          title={isLocked ? "Unpin" : "Pin current view"}
        >
          {isLocked ? <PinOff size={12} /> : <Pin size={12} />}
          {isLocked ? "Fijado" : "Fijar"}
        </button>
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 overflow-y-auto">
          {currentView === "diff" && <DiffView />}
          {currentView === "artifact" && <ContextPanel />}
          {currentView === "details" && <DetailsTab />}
          {currentView === "reports" && <ReportPreview />}
          {currentView === "kpi" && <KpiDashboard />}
        </div>
      </div>
    </aside>
  );
}
