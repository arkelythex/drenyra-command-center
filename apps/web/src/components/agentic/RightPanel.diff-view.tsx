"use client";

/**
 * Diff view components extracted from RightPanel.
 *
 * Renders unified and split diff views for file changes.
 */

import { useState, useMemo } from "react";
import { FileCode, SplitSquareHorizontal, AlignLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDiffApprovalStore } from "@/stores/diff-approval-store";
import { computeFileDiff, computeSplitPairs } from "./RightPanel.diff-utils";
import type { RenderedDiffLine, DiffStats, SplitPair } from "./RightPanel.diff-utils";

// ─── Sub-components ───────────────────────────────────────────────────────────

function DiffLineRow({ line }: { line: RenderedDiffLine }) {
  if (line.type === "hunk") {
    return (
      <div className="flex bg-[var(--surface-2)] font-mono text-xs leading-6">
        <span className="flex-1 px-3 text-[var(--text-secondary)] font-medium">
          {line.content}
        </span>
      </div>
    );
  }

  const bgClass =
    line.type === "added"
      ? "bg-[var(--color-success)]/8"
      : line.type === "removed"
        ? "bg-[var(--color-danger)]/8"
        : "";

  const textClass =
    line.type === "added"
      ? "text-[var(--color-success)]"
      : line.type === "removed"
        ? "text-[var(--color-danger)]"
        : "text-[var(--text-primary)]";

  const gutterChar =
    line.type === "added" ? "+" : line.type === "removed" ? "-" : " ";

  return (
    <div className={cn("flex font-mono text-xs leading-6", bgClass)}>
      <span className="w-12 shrink-0 text-right text-[var(--text-muted)] select-none">
        {line.oldLine ?? ""}
      </span>
      <span className="w-12 shrink-0 text-right text-[var(--text-muted)] select-none">
        {line.newLine ?? ""}
      </span>
      <span className={cn("w-5 shrink-0 text-center select-none", textClass)}>
        {gutterChar}
      </span>
      <span className={cn("flex-1 whitespace-pre px-2", textClass)}>
        {line.content}
      </span>
    </div>
  );
}

function SplitView({ pairs }: { pairs: SplitPair[] }) {
  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-hidden border-r border-[var(--border-subtle)]">
        <div className="sticky top-0 z-10 bg-[var(--surface-2)] px-3 py-1 text-xs font-medium text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
          Old
        </div>
        <div className="font-mono text-xs">
          {pairs.map((pair, i) => (
            <div
              key={i}
              className={cn(
                "flex leading-6",
                pair.oldLine?.type === "removed" &&
                  "bg-[var(--color-danger)]/8",
              )}
            >
              <span className="w-12 shrink-0 text-right text-[var(--text-muted)] select-none" />
              <span
                className={cn(
                  "w-5 shrink-0 text-center select-none",
                  pair.oldLine?.type === "removed" &&
                    "text-[var(--color-danger)]",
                )}
              >
                {pair.oldLine?.type === "removed" ? "-" : " "}
              </span>
              <span
                className={cn(
                  "flex-1 whitespace-pre px-2",
                  pair.oldLine?.type === "removed"
                    ? "text-[var(--color-danger)]"
                    : "text-[var(--text-primary)]",
                )}
              >
                {pair.oldLine?.content ?? ""}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="sticky top-0 z-10 bg-[var(--surface-2)] px-3 py-1 text-xs font-medium text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
          New
        </div>
        <div className="font-mono text-xs">
          {pairs.map((pair, i) => (
            <div
              key={i}
              className={cn(
                "flex leading-6",
                pair.newLine?.type === "added" &&
                  "bg-[var(--color-success)]/8",
              )}
            >
              <span className="w-12 shrink-0 text-right text-[var(--text-muted)] select-none" />
              <span
                className={cn(
                  "w-5 shrink-0 text-center select-none",
                  pair.newLine?.type === "added" &&
                    "text-[var(--color-success)]",
                )}
              >
                {pair.newLine?.type === "added" ? "+" : " "}
              </span>
              <span
                className={cn(
                  "flex-1 whitespace-pre px-2",
                  pair.newLine?.type === "added"
                    ? "text-[var(--color-success)]"
                    : "text-[var(--text-primary)]",
                )}
              >
                {pair.newLine?.content ?? ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatsBar({ added, removed }: { added: number; removed: number }) {
  if (added === 0 && removed === 0) return null;
  return (
    <div className="flex items-center gap-3 px-3 py-1.5 border-b border-[var(--border-subtle)] bg-[var(--surface-2)]/50 text-xs">
      {added > 0 && (
        <span className="text-[var(--color-success)] font-medium tabular-nums">
          +{added}
        </span>
      )}
      {removed > 0 && (
        <span className="text-[var(--color-danger)] font-medium tabular-nums">
          -{removed}
        </span>
      )}
    </div>
  );
}

// ─── Main diff view ───────────────────────────────────────────────────────────

export function DiffView() {
  const diffFiles = useDiffApprovalStore((s) => s.diffFiles);
  const [selectedPath, setSelectedPath] = useState(
    diffFiles[0]?.fileName ?? null,
  );
  const [splitMode, setSplitMode] = useState(false);

  const selectedFile = diffFiles.find((f) => f.fileName === selectedPath);

  const diffs = useMemo(() => {
    const map = new Map<
      string,
      { lines: RenderedDiffLine[]; stats: DiffStats }
    >();
    for (const file of diffFiles) {
      map.set(file.fileName, computeFileDiff(file.oldText, file.newText));
    }
    return map;
  }, [diffFiles]);

  const splitPairs = useMemo(() => {
    if (!selectedFile || !splitMode) return [];
    return computeSplitPairs(selectedFile.oldText, selectedFile.newText);
  }, [selectedFile, splitMode]);

  if (diffFiles.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center px-6">
        <FileCode size={32} className="text-[var(--text-muted)] mb-3" />
        <p className="text-sm text-[var(--text-muted)]">No changes to display</p>
      </div>
    );
  }

  const currentDiff = selectedFile ? diffs.get(selectedFile.fileName) : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface-2)]/50 px-3 py-1">
        <span className="text-xs text-[var(--text-muted)]">
          {diffFiles.length} file{diffFiles.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={() => setSplitMode(!splitMode)}
          className={cn(
            "flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors",
            splitMode
              ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]",
          )}
          title={splitMode ? "Unified view" : "Split view"}
        >
          {splitMode ? (
            <AlignLeft size={12} />
          ) : (
            <SplitSquareHorizontal size={12} />
          )}
          {splitMode ? "Unified" : "Split"}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[200px] shrink-0 border-r border-[var(--border-subtle)] overflow-y-auto">
          {diffFiles.map((file) => {
            const status = file.status ?? "modified";
            const statusLabel =
              status === "added" ? "A" : status === "deleted" ? "D" : "M";
            const statusColor =
              status === "added"
                ? "bg-[var(--color-success)] text-white"
                : status === "deleted"
                  ? "bg-[var(--color-danger)] text-white"
                  : "bg-[var(--color-warning)]/20 text-[var(--color-warning)]";

            return (
              <button
                key={file.fileName}
                onClick={() => setSelectedPath(file.fileName)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors",
                  "border-b border-[var(--border-subtle)] last:border-0",
                  "hover:bg-[var(--surface-2)]",
                  selectedPath === file.fileName &&
                    "bg-[var(--surface-2)] text-[var(--color-primary)]",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-2xs font-bold",
                    statusColor,
                  )}
                >
                  {statusLabel}
                </span>
                <span className="flex-1 truncate">{file.fileName}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedFile && currentDiff ? (
            <>
              <StatsBar
                added={currentDiff.stats.added}
                removed={currentDiff.stats.removed}
              />
              <div className="flex-1 overflow-auto">
                {splitMode ? (
                  <SplitView pairs={splitPairs} />
                ) : (
                  <div className="p-0">
                    {currentDiff.lines.map((line, i) => (
                      <DiffLineRow key={i} line={line} />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">
              Select a file to view diff
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
