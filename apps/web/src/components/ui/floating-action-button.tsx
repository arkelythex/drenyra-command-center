import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from '@tanstack/react-router';
import { useHaptics } from '@/hooks/useHaptics';
import { CollapsedFab } from './floating-action-button/collapsed-fab';
import { QUICK_ACTIONS, QUICK_ROUTES } from './floating-action-button/constants';
import { ExpandedOmnibar } from './floating-action-button/expanded-omnibar';
import type { FloatingActionButtonProps, QuickRoute } from './floating-action-button/types';

export function FloatingActionButton({ onAction, className }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  const lastClickTime = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { trigger } = useHaptics();
  const navigate = useNavigate();

  const filteredRoutes = useMemo(
    () =>
      query.startsWith('/')
        ? QUICK_ROUTES.filter((route) => route.path.toLowerCase().includes(query.toLowerCase().slice(1)))
        : [],
    [query],
  );

  useEffect(() => {
    if (!isExpanded || !inputRef.current) {
      return;
    }

    trigger('medium');
    const timeout = setTimeout(() => inputRef.current?.focus(), prefersReducedMotion ? 40 : 140);
    return () => clearTimeout(timeout);
  }, [isExpanded, prefersReducedMotion, trigger]);

  useEffect(() => {
     
    setSelectedIndex(0);
  }, [query]);

  const handleMainClick = () => {
    const now = Date.now();
    const isDoubleTap = now - lastClickTime.current < 300;

    if (isDoubleTap) {
      trigger('heavy');
      setIsOpen(false);
      setIsExpanded(true);
    } else if (!isExpanded) {
      trigger('light');
      setIsOpen((current) => !current);
    }

    lastClickTime.current = now;
  };

  const handleNavigation = (path: QuickRoute['path']) => {
    trigger('success');
    navigate({ to: path });
    setIsExpanded(false);
    setQuery('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsExpanded(false);
      setQuery('');
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((previous) => (filteredRoutes.length ? (previous + 1) % filteredRoutes.length : 0));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((previous) =>
        filteredRoutes.length ? (previous - 1 + filteredRoutes.length) % filteredRoutes.length : 0,
      );
      return;
    }

    if (event.key === 'Enter' && filteredRoutes[selectedIndex]) {
      event.preventDefault();
      handleNavigation(filteredRoutes[selectedIndex].path);
    }
  };

  const handleActionSelect = (actionId: string) => {
    if (actionId === 'command-palette') {
      setIsExpanded(true);
      setIsOpen(false);
      return;
    }

    onAction(actionId);
    setIsOpen(false);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <CollapsedFab
            isOpen={isOpen}
            className={className}
            actions={QUICK_ACTIONS}
            onMainClick={handleMainClick}
            onSelectAction={handleActionSelect}
          />
        ) : (
          <ExpandedOmnibar
            inputRef={inputRef}
            query={query}
            selectedIndex={selectedIndex}
            filteredRoutes={filteredRoutes}
            onQueryChange={setQuery}
            onKeyDown={handleKeyDown}
            onRouteSelect={handleNavigation}
          />
        )}
      </AnimatePresence>

      {isExpanded ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.08 : 0.14, ease: 'easeOut' }}
          className="fixed inset-0 z-[90] bg-black/16"
          onClick={() => setIsExpanded(false)}
          role="presentation"
          tabIndex={-1}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsExpanded(false); } }}
        />
      ) : null}

      {isOpen && !isExpanded ? (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      ) : null}
    </>
  );
}
