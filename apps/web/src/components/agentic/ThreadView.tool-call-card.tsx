"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Terminal,
} from "lucide-react";
import type { ToolCall } from "./ThreadView.types";

// ─── Tool Call Card ─────────────────────────────────────────────────────────

export function ToolCallCard({ toolCall }: { toolCall: ToolCall }) {
  const [expanded, setExpanded] = useState(false);

  const statusIcon: Record<ToolCall["status"], React.ReactNode> = {
    running: <Loader2 size={14} className="animate-spin text-[var(--premium-info)]" />,
    completed: <CheckCircle2 size={14} className="text-[var(--premium-success)]" />,
    error: <AlertCircle size={14} className="text-[var(--premium-danger)]" />,
  };

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-[var(--surface-3)]"
      >
        {expanded ? (
          <ChevronDown size={12} className="shrink-0 text-[var(--text-muted)]" />
        ) : (
          <ChevronRight size={12} className="shrink-0 text-[var(--text-muted)]" />
        )}
        <Terminal size={12} className="shrink-0 text-[var(--text-muted)]" />
        <span className="flex-1 truncate text-xs font-medium text-[var(--text-primary)]">
          {toolCall.name}
        </span>
        {statusIcon[toolCall.status]}
      </button>
      <AnimatePresence>
        {expanded && toolCall.output && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <pre className="border-t border-[var(--border-subtle)] p-3 font-mono text-xs leading-relaxed text-[var(--text-secondary)]">
              {toolCall.output}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
      {toolCall.error && (
        <div className="border-t border-[var(--border-subtle)] bg-[var(--color-danger)]/5 px-3 py-2 text-xs text-[var(--premium-danger)]">
          {toolCall.error}
        </div>
      )}
    </div>
  );
}
