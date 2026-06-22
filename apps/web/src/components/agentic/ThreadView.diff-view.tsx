"use client";

import { FileCode } from "lucide-react";
import type { DiffBlock } from "./ThreadView.types";

// ─── Diff View ───────────────────────────────────────────────────────────────

export function DiffView({ diff }: { diff: DiffBlock }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border-subtle)]">
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2">
        <FileCode size={12} className="text-[var(--text-muted)]" />
        <span className="text-xs font-medium text-[var(--text-primary)]">
          {diff.filePath}
        </span>
      </div>
      <div className="overflow-x-auto">
        {diff.hunks.map((hunk, i) => {
          const lines = hunk.content.split("\n");
          return (
            <div key={i}>
              {lines.map((line, j) => {
                if (line.startsWith("+")) {
                  return (
                    <div
                      key={j}
                      className="flex bg-[var(--premium-success)]/5 px-3 py-px font-mono text-xs leading-6"
                    >
                      <span className="mr-4 w-8 shrink-0 select-none text-right text-[var(--text-muted)]">
                        {hunk.newStart + j}
                      </span>
                      <span className="text-[var(--premium-success)]">
                        {line}
                      </span>
                    </div>
                  );
                }
                if (line.startsWith("-")) {
                  return (
                    <div
                      key={j}
                      className="flex bg-[var(--premium-danger)]/5 px-3 py-px font-mono text-xs leading-6"
                    >
                      <span className="mr-4 w-8 shrink-0 select-none text-right text-[var(--text-muted)]">
                        {hunk.oldStart + j}
                      </span>
                      <span className="text-[var(--premium-danger)]">{line}</span>
                    </div>
                  );
                }
                return (
                  <div
                    key={j}
                    className="flex px-3 py-px font-mono text-xs leading-6 text-[var(--text-secondary)]"
                  >
                    <span className="mr-4 w-8 shrink-0 select-none text-right text-[var(--text-muted)]">
                      {hunk.oldStart + j}
                    </span>
                    <span>{line}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
