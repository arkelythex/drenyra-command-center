"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Pencil,
  Copy,
  MoreHorizontal,
  ExternalLink,
  GitBranch,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// ─── Thread Header ───────────────────────────────────────────────────────────

export function ThreadViewHeader({
  threadId,
  title,
  onRename,
  onFork,
}: {
  threadId: string;
  title: string;
  onRename: (title: string) => void;
  onFork: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    setEditValue(title);
  }, [title]);

  const handleSubmit = useCallback(() => {
    if (editValue.trim()) {
      onRename(editValue.trim());
    }
    setEditing(false);
  }, [editValue, onRename]);

  const handleCancel = useCallback(() => {
    setEditValue(title);
    setEditing(false);
  }, [title]);

  return (
    <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        {editing ? (
          <input
            aria-label="Edit thread title"
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
              if (e.key === "Escape") handleCancel();
            }}
            onClick={(e) => e.stopPropagation()}
            className="rounded border border-[var(--border-default)] bg-[var(--surface-2)] px-2 py-1 text-sm font-medium text-[var(--text-primary)] outline-none"
          />
        ) : (
          <div className="flex items-center gap-2">
            <span
              onClick={() => setEditing(true)}
              className="cursor-pointer text-sm font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--color-primary)]"
            >
              {title}
            </span>
            <button
              aria-label="Edit title"
              onClick={() => setEditing(true)}
              className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] opacity-0 transition-opacity hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] group-hover:opacity-100"
            >
              <Pencil size={12} />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          aria-label="Pop out thread"
          onClick={() =>
            window.open(
              `/popout/${threadId}`,
              "_blank",
              "width=800,height=600,left=" +
                Math.round((screen.width - 800) / 2) +
                ",top=" +
                Math.round((screen.height - 600) / 2),
            )
          }
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
          title="Pop out thread"
        >
          <ExternalLink size={14} />
        </button>
        <button
          aria-label="Fork thread"
          onClick={onFork}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
          title="Fork thread"
        >
          <GitBranch size={14} />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="More options"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]">
              <MoreHorizontal size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditing(true)}>
              <Pencil size={14} className="mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onFork}>
              <GitBranch size={14} className="mr-2" />
              Fork
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(threadId)}>
              <Copy size={14} className="mr-2" />
              Copy ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
