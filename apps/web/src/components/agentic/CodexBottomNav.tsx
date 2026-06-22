import { MessageSquare, PanelLeft, Eye, Terminal, Rocket } from "lucide-react";
import { useUIStore } from "../../store/ui-store";

interface CodexBottomNavProps {
  onToggleMissions?: () => void;
}

export function CodexBottomNav({ onToggleMissions }: CodexBottomNavProps) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleRightPanel = useUIStore((s) => s.toggleRightRail);
  const toggleTerminal = useUIStore((s) => s.toggleTerminal);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t border-[var(--border-subtle)] bg-[var(--surface-1)]/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden">
      <button
        className="flex h-full flex-1 flex-col items-center justify-center gap-0.5 text-[var(--text-primary)]"
        aria-label="Chat"
      >
        <MessageSquare size={18} />
        <span className="text-[10px] font-medium leading-none">Chat</span>
      </button>
      <button
        onClick={toggleSidebar}
        className="flex h-full flex-1 flex-col items-center justify-center gap-0.5 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        aria-label="Toggle sidebar"
      >
        <PanelLeft size={18} />
        <span className="text-[10px] font-medium leading-none">Sidebar</span>
      </button>
      <button
        onClick={onToggleMissions}
        className="flex h-full flex-1 flex-col items-center justify-center gap-0.5 text-[var(--text-secondary)] transition-colors hover:text-[var(--color-primary)]"
        aria-label="Toggle missions"
      >
        <Rocket size={18} />
        <span className="text-[10px] font-medium leading-none">Misiones</span>
      </button>
      <button
        onClick={toggleRightPanel}
        className="flex h-full flex-1 flex-col items-center justify-center gap-0.5 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        aria-label="Toggle artifacts"
      >
        <Eye size={18} />
        <span className="text-[10px] font-medium leading-none">Artifacts</span>
      </button>
      <button
        onClick={toggleTerminal}
        className="flex h-full flex-1 flex-col items-center justify-center gap-0.5 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        aria-label="Toggle terminal"
      >
        <Terminal size={18} />
        <span className="text-[10px] font-medium leading-none">Terminal</span>
      </button>
    </nav>
  );
}
