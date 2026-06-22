import { useState, type ReactNode, lazy, Suspense } from "react";
import { Outlet } from "@tanstack/react-router";
import { PanelLeft, Eye, Terminal, Rocket } from "lucide-react";
import { useUIStore } from "../../store/ui-store";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { CommandPalette } from "../agentic/CommandPalette";
import { AccountingTopBar } from "../agentic/AccountingTopBar";
import { RightPanel } from "../agentic/RightPanel";
import { CodexBottomNav } from "../agentic/CodexBottomNav";
import { MissionSidebar } from "../../features/cognitive-hub/components/MissionSidebar";
import { useCodexKeyboardShortcuts } from "../../hooks/useCodexKeyboardShortcuts";

const TerminalShell = lazy(
  () => import("../agentic/TerminalShell").then((m) => ({ default: m.TerminalShell })),
);

interface CodexShellProps {
  children?: ReactNode;
}

export function CodexShell({ children }: CodexShellProps) {
  useCodexKeyboardShortcuts();

  const sidebarOpen = useUIStore((s) => s.isSidebarOpen);
  const rightPanelOpen = useUIStore((s) => s.isRightRailOpen);
  const terminalOpen = useUIStore((s) => s.terminalOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleRightPanel = useUIStore((s) => s.toggleRightRail);
  const toggleTerminal = useUIStore((s) => s.toggleTerminal);
  const [missionSidebarOpen, setMissionSidebarOpen] = useState(false);

  return (
    <div className="flex h-full flex-col pb-14 lg:pb-0">
      <CommandPalette />
      {/* Three-panel row */}
      <div className="flex min-h-0 flex-1">
        {/* Thread sidebar */}
        <aside
          className={cn(
            "flex-shrink-0 overflow-y-auto border-r border-[var(--border-subtle)] bg-[var(--surface-1)] transition-[width] duration-200 ease-in-out",
            "max-xl:fixed max-xl:bottom-0 max-xl:left-0 max-xl:top-0 max-xl:z-30",
            sidebarOpen
              ? "w-[300px] max-xl:w-72 max-xl:max-w-[85vw]"
              : "w-0 overflow-hidden max-xl:w-0",
          )}
          aria-hidden={!sidebarOpen}
        >
          {sidebarOpen && (
            <div className="flex h-full min-w-[260px] max-xl:min-w-0 flex-col">
              <Sidebar isCollapsed={false} onToggle={() => {}} onNavigate={() => {}} />
            </div>
          )}
        </aside>

        {/* Sidebar overlay backdrop (mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 xl:hidden"
            onClick={toggleSidebar}
            role="presentation"
            tabIndex={-1}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSidebar(); } }}
          />
        )}

        {/* Main area — child routes render the actual view */}
        <main className="relative flex min-w-0 flex-1 flex-col">
          <AccountingTopBar />
          {/* Mobile panel toggles */}
          <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 lg:hidden">
            <button
              onClick={toggleSidebar}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)]/90 px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] shadow-sm backdrop-blur-sm transition-colors hover:text-[var(--text-primary)]"
              aria-label="Toggle sidebar"
            >
              <PanelLeft size={14} />
              <span>Sidebar</span>
            </button>
            <button
              onClick={toggleRightPanel}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)]/90 px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] shadow-sm backdrop-blur-sm transition-colors hover:text-[var(--text-primary)]"
              aria-label="Toggle right panel"
            >
              <Eye size={14} />
              <span>Panel</span>
            </button>
            <button
              onClick={() => setMissionSidebarOpen(!missionSidebarOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)]/90 px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] shadow-sm backdrop-blur-sm transition-colors hover:text-[var(--color-primary)]"
              aria-label="Toggle missions"
            >
              <Rocket size={14} />
              <span>Misiones</span>
            </button>
          </div>

          {/* Desktop mission toggle */}
          <button
            onClick={() => setMissionSidebarOpen(!missionSidebarOpen)}
            className={cn(
              "fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/90 px-3 py-2.5 text-xs font-medium text-[var(--text-secondary)] shadow-lg backdrop-blur-sm transition-colors hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)]",
              "max-lg:hidden",
            )}
            aria-label="Toggle missions"
          >
            <Rocket size={16} />
            <span>Misiones</span>
          </button>

          <Outlet />
        </main>

        {/* Right panel */}
        {rightPanelOpen && (
          <aside
            className={cn(
              "flex-shrink-0 border-l border-[var(--border-subtle)] bg-[var(--surface-1)]",
              "w-[480px] max-xl:w-full max-xl:max-w-[480px] max-xl:fixed max-xl:bottom-0 max-xl:right-0 max-xl:top-0 max-xl:z-40",
            )}
          >
            {/* Close button — visible only in overlay mode */}
            <button
              onClick={toggleRightPanel}
              className={cn(
                "absolute right-3 top-3 z-50 hidden rounded-md p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]",
                "max-xl:inline-flex",
              )}
              aria-label="Close right panel"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <RightPanel />
          </aside>
        )}

        {/* Right panel overlay backdrop (< xl) */}
        {rightPanelOpen && (
          <div
            className="fixed inset-0 z-30 hidden bg-black/50 max-xl:block"
            onClick={toggleRightPanel}
            role="presentation"
            tabIndex={-1}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRightPanel(); } }}
          />
        )}

        {/* MissionSidebar */}
        {missionSidebarOpen && (
          <>
            <aside className="flex-shrink-0 border-l border-[var(--border-subtle)] bg-[var(--surface-1)] max-xl:hidden">
              <MissionSidebar isOpen={true} onClose={() => setMissionSidebarOpen(false)} />
            </aside>
            {/* Mobile overlay */}
            <div
              className="fixed inset-0 z-30 bg-black/50 xl:hidden"
              onClick={() => setMissionSidebarOpen(false)}
              aria-hidden="true"
            />
            <div className="fixed bottom-0 right-0 top-0 z-40 xl:hidden">
              <MissionSidebar isOpen={true} onClose={() => setMissionSidebarOpen(false)} />
            </div>
          </>
        )}
      </div>

      {/* Terminal drawer (in-flow, pushes panels up) */}
      <div
        className={cn(
          "flex-shrink-0 border-t border-[var(--border-subtle)] bg-[#0a0a0e] transition-[height] duration-200 ease-in-out overflow-hidden",
          terminalOpen ? "h-[200px]" : "h-0",
        )}
      >
        {terminalOpen && (
          <div className="flex h-full min-h-[200px] flex-col">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-1.5">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Terminal
              </span>
              <button
                onClick={toggleTerminal}
                className="rounded p-0.5 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                aria-label="Close terminal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs text-[var(--text-muted)]">Cargando terminal...</div>}>
              <TerminalShell className="flex-1" />
            </Suspense>
          </div>
        )}
      </div>

      <CodexBottomNav onToggleMissions={() => setMissionSidebarOpen(!missionSidebarOpen)} />
    </div>
  );
}
