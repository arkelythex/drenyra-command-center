import { useEffect, useCallback } from "react";
import { X } from "lucide-react";

export interface ShortcutReferenceProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  title: string;
  shortcuts: ShortcutItem[];
}

const categories: ShortcutCategory[] = [
  {
    title: "Navegación",
    shortcuts: [
      { keys: ["⌘", "K"], description: "Abrir paleta" },
      { keys: ["Esc"], description: "Cerrar panel" },
      { keys: ["⌘", "N"], description: "Nuevo caso" },
      { keys: ["⌘", "R"], description: "Correr agente" },
    ],
  },
  {
    title: "Chat",
    shortcuts: [
      { keys: ["Enter"], description: "Enviar mensaje" },
      { keys: ["⌘", "⇧", "C"], description: "Limpiar chat" },
      { keys: ["⌘", "U"], description: "Subir evidencia" },
    ],
  },
  {
    title: "Vista",
    shortcuts: [
      { keys: ["⌘", "1"], description: "Vista compacta" },
      { keys: ["⌘", "2"], description: "Vista detalle" },
      { keys: ["⌘", "3"], description: "Solo números" },
    ],
  },
];

const commands: string[] = [
  "/compacto",
  "/detalle",
  "/numeros",
  "/rama <nombre>",
  "/rama main",
  "/clear",
  "/help",
];

export function ShortcutReference({ isOpen, onClose }: ShortcutReferenceProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} role="presentation" tabIndex={-1} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClose(); } }} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          className="max-w-lg w-full rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Atajos de teclado
            </h2>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[70vh] p-4 space-y-5">
            {categories.map((cat) => (
              <section key={cat.title}>
                <h3 className="text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                  {cat.title}
                </h3>
                <div className="space-y-0.5">
                  {cat.shortcuts.map((s) => (
                    <div
                      key={s.keys.join("")}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-sm text-[var(--text-primary)]">
                        {s.description}
                      </span>
                      <span className="flex items-center gap-1">
                        {s.keys.map((k) => (
                          <kbd
                            key={k}
                            className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-2)] px-1.5 py-0.5 text-xs font-mono text-[var(--text-muted)]"
                          >
                            {k}
                          </kbd>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <section>
              <h3 className="text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                Comandos de chat
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {commands.map((cmd) => (
                  <code
                    key={cmd}
                    className="font-mono text-xs text-[var(--color-info)] bg-[var(--surface-2)] rounded px-2 py-0.5"
                  >
                    {cmd}
                  </code>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
