"use client";

import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { getCommandSuggestions } from "@/features/cognitive-hub/logic/intent-parser";

interface SlashCommandMenuProps {
  input: string;
  selectedIndex: number;
  onSelect: (index: number) => void;
  onHover: (index: number) => void;
  onClose: () => void;
}

export function SlashCommandMenu({
  input,
  selectedIndex,
  onSelect,
  onHover,
  onClose,
}: SlashCommandMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const suggestions = useMemo(() => getCommandSuggestions(input), [input]);

  useEffect(() => {
    if (suggestions.length === 0) {
      onClose();
    }
  }, [suggestions.length, onClose]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  if (suggestions.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className={cn(
        "absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl",
        "border border-[var(--border-subtle)]",
        "bg-[var(--surface-1)] shadow-lg backdrop-blur-xl",
      )}
    >
      <div className="border-b border-[var(--border-subtle)] px-3 py-2">
        <span className="text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
          Comandos
        </span>
      </div>
      <div className="p-1">
        {suggestions.map((suggestion, index) => (
          <button
            key={suggestion.command}
            type="button"
            onClick={() => onSelect(index)}
            onMouseEnter={() => onHover(index)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
              index === selectedIndex
                ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]",
            )}
          >
            <span className="min-w-[5rem] font-mono text-xs font-semibold">
              {suggestion.command}
            </span>
            <div className="flex-1">
              <span className="block text-xs font-medium">
                {suggestion.title}
              </span>
              <span className="block text-2xs text-[var(--text-tertiary)]">
                {suggestion.description}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
