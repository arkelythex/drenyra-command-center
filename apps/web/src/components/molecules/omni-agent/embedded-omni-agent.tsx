import type { KeyboardEvent } from 'react';
import { BrainCircuit, Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EmbeddedOmniAgentProps } from './types';

export function EmbeddedOmniAgent({
  activeTraceId,
  artifactEvents,
  clearArtifactEvents,
  cot,
  ghostCompletion,
  ghostSuggestion,
  inputRef,
  isThinking,
  onSubmit,
  query,
  setQuery,
}: EmbeddedOmniAgentProps) {
  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Tab' && ghostSuggestion) {
      event.preventDefault();
      setQuery(ghostSuggestion);
      return;
    }

    if (event.key === 'Enter' && query.trim()) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="flex h-full flex-col bg-transparent">
      <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-6">
        {artifactEvents.length > 0 ? (
          <div className="space-y-2 rounded-2xl border border-primary/20 bg-primary/10 px-3 py-2">
            <div className="flex items-center justify-between">
              <p className="text-2xs font-black uppercase tracking-wide text-primary">Artifact Audit Trail</p>
              <button
                type="button"
                onClick={clearArtifactEvents}
                className="text-3xs font-black uppercase tracking-wider text-primary/70 hover:text-primary"
              >
                Limpiar
              </button>
            </div>
            <div className="space-y-1.5">
              {artifactEvents.slice(0, 4).map((event) => (
                <div key={event.id} className="rounded-lg border border-primary/15 bg-muted/40 px-2 py-1.5">
                  <p className="text-2xs font-semibold uppercase tracking-tight text-primary">{event.message}</p>
                  <p className="mt-0.5 text-3xs font-mono text-primary/60">
                    {event.actionId} ·{' '}
                    {new Date(event.createdAt).toLocaleTimeString('es-PE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {isThinking || cot.length > 0 ? (
          <div className="animate-in space-y-4 fade-in duration-500">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles size={12} className="animate-pulse text-primary" />
              <span className="text-3xs font-black uppercase tracking-[0.3em] text-foreground">Active Trace</span>
            </div>
            {cot.map((step, index) => (
              <div key={`${step}-${index}`} className="group flex animate-in items-start gap-4 slide-in-from-left-2 duration-300">
                <div
                  className={cn(
                    'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                    index === cot.length - 1
                      ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]'
                      : 'bg-muted-foreground/30',
                  )}
                />
                <div className="flex-1">
                  <p
                    className={cn(
                      'text-label font-medium uppercase tracking-tight leading-relaxed',
                      index === cot.length - 1 ? 'text-foreground' : 'text-muted-foreground/40',
                    )}
                  >
                    {step}
                  </p>
                  {index === cot.length - 1 ? (
                    <div className="mt-2 flex gap-3 text-3xs font-mono text-primary/50">
                      <span>traceId: {activeTraceId ?? 'trace-pending'}</span>
                      <span>source: internal_ledger</span>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center space-y-4 text-center opacity-20">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted/40">
              <BrainCircuit size={24} strokeWidth={1} />
            </div>
            <p className="text-2xs font-black uppercase tracking-[0.3em]">Awaiting Command</p>
          </div>
        )}
      </div>

      <div className="border-t border-border bg-card/80 p-4 backdrop-blur-md">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-2 transition-[background-color,border-color,box-shadow] duration-200 focus-within:border-primary/40">
          <button
            aria-label="Toggle actions"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-primary">
            <Plus size={16} />
          </button>
          <div className="relative flex-1">
            {ghostSuggestion ? (
              <div className="pointer-events-none absolute inset-0 flex items-center text-xs font-bold uppercase tracking-tight text-muted-foreground/30">
                <span className="invisible">{query}</span>
                <span>{ghostCompletion}</span>
              </div>
            ) : null}
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Ask or command (/)..."
              aria-label="Ask or command"
              className="relative z-10 w-full border-none bg-transparent text-xs font-bold uppercase tracking-tight text-foreground outline-none placeholder:text-muted-foreground/30"
            />
          </div>
          <div className="flex gap-1 pr-2">
            <kbd className="h-5 rounded border border-border bg-muted px-1.5 text-3xs font-mono text-muted-foreground">⌘</kbd>
            <kbd className="h-5 rounded border border-border bg-muted px-1.5 text-3xs font-mono text-muted-foreground">Tab</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
