import { useState, useRef, type ComponentType } from "react";
import { Search } from "lucide-react";

export type PaletteCmd =
  | { separator: true }
  | {
      label: string;
      icon: ComponentType<{ className?: string }>;
      shortcut: string;
      action: () => void;
    };

interface DrenyraCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: PaletteCmd[];
}

export function DrenyraCommandPalette({ isOpen, onClose, commands }: DrenyraCommandPaletteProps) {
  const [filterText, setFilterText] = useState("");
  const commandPaletteRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const filteredCommands = filterText
    ? commands.filter(
        (c) => "separator" in c || c.label.toLowerCase().includes(filterText.toLowerCase()),
      )
    : commands;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={onClose}
      role="presentation"
      tabIndex={-1}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClose(); } }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        ref={commandPaletteRef}
        className="relative w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-2xl backdrop-blur-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar comandos..."
            autoFocus
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
            aria-label="Buscar comando"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {filteredCommands.map((cmd, i) =>
            "separator" in cmd ? (
              <div
                key={i}
                className="my-1 border-t border-[var(--border-subtle)]"
              />
            ) : (
              <button
                key={i}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--accent-subtle)]"
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
              >
                <cmd.icon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                <span className="flex-1 text-left">{cmd.label}</span>
                <kbd className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                  {cmd.shortcut}
                </kbd>
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
