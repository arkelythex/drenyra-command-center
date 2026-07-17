'use client';

import type { Mission } from '@/types/drone';

const statusStyle: Record<Mission['status'], string> = {
  completed: 'bg-success/10 text-success',
  in_flight: 'bg-accent-400/10 text-accent-400',
  failed: 'bg-error/10 text-error',
  planning: 'bg-warning/10 text-warning',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function MissionHistory({
  missions,
  activeId,
  onSelect,
}: {
  missions: Mission[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="h-full flex flex-col bg-bg-void">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Missions</span>
        <span className="text-xs bg-bg-elevated text-text-muted px-1.5 py-0.5 rounded-full font-mono">
          {missions.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {missions.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className={`w-full text-left px-4 py-3 border-b border-border-subtle/50 transition-all duration-200 hover:bg-bg-elevated ${
              m.id === activeId ? 'bg-bg-elevated border-l-2 border-l-accent-400' : ''
            }`}
          >
            <div className="text-sm font-medium text-text-primary truncate">
              {m.name}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${
                  statusStyle[m.status]
                }`}
              >
                {m.status.replace('_', ' ')}
              </span>
              <span className="text-[11px] text-text-muted font-mono">
                {formatDate(m.startedAt)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
