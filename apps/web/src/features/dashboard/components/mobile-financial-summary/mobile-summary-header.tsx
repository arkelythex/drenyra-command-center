import { cn } from '@/lib/utils';
import type { MobileSummaryTab } from './mobile-summary.types';
import { Text } from '@/components/atoms/text';

interface MobileSummaryHeaderProps {
  tabs: MobileSummaryTab[];
  activeTab: MobileSummaryTab;
  onTabChange: (tab: MobileSummaryTab) => void;
}

export function MobileSummaryHeader({ tabs, activeTab, onTabChange }: MobileSummaryHeaderProps) {
  return (
    <div className="space-y-7 px-6 pb-6 pt-14">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <Text variant="label" className="text-[var(--text-tertiary)]">
            Estado general
          </Text>
          <div className="flex items-center gap-2.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-sunat-success)]" />
            <Text variant="body" className="text-[12px] font-bold uppercase tracking-tight text-foreground">
              Operación activa
            </Text>
          </div>
        </div>
        <div className="glass-panel flex h-11 w-11 items-center justify-center rounded-2xl border-border/40 bg-card/45 shadow-sm">
          <div className="h-2 w-2 rounded-full bg-[var(--color-sunat-success)]" />
        </div>
      </div>

      <div className="glass-panel flex items-center justify-between rounded-3xl border-border/40 bg-card/55 p-1.5 backdrop-blur-md">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={cn(
              'relative flex-1 overflow-hidden rounded-2xl px-4 py-3 text-2xs font-bold uppercase tracking-[0.12em] transition-[color,transform] duration-200',
              activeTab === tab
                ? 'z-10 text-background'
                : 'text-[var(--text-tertiary)] hover:text-foreground',
            )}
          >
            {activeTab === tab && (
              <div className="absolute inset-0 z-[-1] rounded-2xl bg-foreground" />
            )}
            <span className="relative z-10">{tab}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
