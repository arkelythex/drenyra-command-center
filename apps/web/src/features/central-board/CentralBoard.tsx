"use client";

import { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useCentralBoardStore, type CentralBoardTab } from "@/stores/central-board-store";
import { BookOpen, FileText, ClipboardList } from "lucide-react";
import { LedgerEditableTable } from "./components/LedgerEditableTable";
import { JournalPendingList } from "./components/JournalPendingList";
import { DocumentsList } from "./components/DocumentsList";
import { useDesignTokens } from "@/lib/design-tokens";

const TABS: {
  key: CentralBoardTab;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  { key: "ledger", label: "Ledger", icon: BookOpen, description: "Transacciones contables" },
  { key: "journal", label: "Journal", icon: ClipboardList, description: "Asientos propuestos" },
  { key: "documents", label: "Documents", icon: FileText, description: "Documentos adjuntos" },
];

export function CentralBoard() {
  const activeTab = useCentralBoardStore((s) => s.centralBoardTab);
  const setActiveTab = useCentralBoardStore((s) => s.setCentralBoardTab);
  const journalEntries = useCentralBoardStore((s) => s.journalEntries);
  const documents = useCentralBoardStore((s) => s.documents);
  const { borderRadius } = useDesignTokens();

  const pendingCount = useMemo(
    () => journalEntries.filter((e) => e.status === "pending").length,
    [journalEntries],
  );

  const handleTabChange = useCallback(
    (tab: CentralBoardTab) => {
      setActiveTab(tab);
    },
    [setActiveTab],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header / Tab bar */}
      <div className="flex items-center gap-0.5 border-b border-[var(--border-subtle)] bg-[var(--surface-1)] px-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                "relative flex items-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors",
                isActive
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
              )}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.key === "journal" && pendingCount > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-2xs font-bold text-white">
                  {pendingCount}
                </span>
              )}
              {/* Active indicator */}
              {isActive && (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[var(--color-primary)]" />
              )}
            </button>
          );
        })}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Subtle hint */}
        <span className="text-2xs text-[var(--text-muted)] hidden sm:block">
          Central Board
        </span>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "ledger" && (
          <LedgerEditableTable />
        )}
        {activeTab === "journal" && (
          <JournalPendingList />
        )}
        {activeTab === "documents" && (
          <DocumentsList />
        )}
      </div>
    </div>
  );
}
