import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useHaptics } from '@/hooks/useHaptics';

export interface TabOption {
  id: string;
  label: string;
}

interface MobileTabNavigationProps {
  tabs: TabOption[] | readonly TabOption[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
  panelPrefix?: string;
}

export const MobileTabNavigation: React.FC<MobileTabNavigationProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className,
  panelPrefix = 'dashboard-panel',
}) => {
  const { trigger } = useHaptics();
  const lastIndex = tabs.length - 1;
  const tabRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  const moveFocus = (currentTabId: string, direction: 'next' | 'prev') => {
    const startIndex = tabs.findIndex((tab) => tab.id === currentTabId);
    if (startIndex < 0) return;
    const nextIndex =
      direction === 'next'
        ? (startIndex + 1) % tabs.length
        : (startIndex - 1 + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];
    onTabChange(nextTab.id);
    requestAnimationFrame(() => tabRefs.current[nextTab.id]?.focus());
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, tabId: string) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveFocus(tabId, 'next');
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveFocus(tabId, 'prev');
      return;
    }

    if (event.key === 'Home' && tabs[0]) {
      event.preventDefault();
      onTabChange(tabs[0].id);
      requestAnimationFrame(() => tabRefs.current[tabs[0].id]?.focus());
      return;
    }

    if (event.key === 'End' && tabs[lastIndex]) {
      event.preventDefault();
      onTabChange(tabs[lastIndex].id);
      requestAnimationFrame(() => tabRefs.current[tabs[lastIndex].id]?.focus());
    }
  };

  return (
    <div className={cn("fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex sm:hidden items-center", className)}>
      <div className="rounded-full border border-border/40 bg-card/85 p-1.5 shadow-xl backdrop-blur-md">
        <div role="tablist" aria-label="Navegación Inteligente" className="flex items-center gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(node) => {
                  tabRefs.current[tab.id] = node;
                }}
                id={`mobile-dashboard-tab-${tab.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`${panelPrefix}-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => {
                  trigger('light');
                  onTabChange(tab.id);
                }}
                onKeyDown={(event) => handleKeyDown(event, tab.id)}
                className={cn(
                  "relative z-10 min-h-10 whitespace-nowrap rounded-full px-6 py-1.5 text-3xs font-black uppercase tracking-[0.2em] transition-[color,transform] duration-200 focus:outline-none",
                  isActive ? "text-background" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-tab-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-foreground shadow-sm"
                    transition={{ duration: 0.18, ease: "easeOut" }}
                  />
                )}
                <span className="relative z-20">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
