"use client";

import { cn } from "@/lib/utils";

interface ComposerControlsProps {
  mode: "local" | "worktree";
  onChangeMode: (mode: "local" | "worktree") => void;
  activeSkills: Set<string>;
  onToggleSkill: (skill: string) => void;
}

const MODES: ("local" | "worktree")[] = ["local", "worktree"];
const SKILLS = ["Fiscal", "Code", "Data"] as const;

export function ComposerControls({
  mode,
  onChangeMode,
  activeSkills,
  onToggleSkill,
}: ComposerControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-0.5"
        role="tablist"
      >
        {MODES.map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => onChangeMode(m)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
              mode === m
                ? "bg-[var(--surface-1)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
            )}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        {SKILLS.map((skill) => {
          const isActive = activeSkills.has(skill);
          return (
            <button
              key={skill}
              onClick={() => onToggleSkill(skill)}
              aria-pressed={isActive}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-all",
                isActive
                  ? "border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                  : "border border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]",
              )}
            >
              {skill}
            </button>
          );
        })}
      </div>
    </div>
  );
}
