import type { KeyboardEvent } from 'react';
import { ChevronRight, Mic, Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FloatingOmniAgentProps } from './types';

export function FloatingOmniAgent({
  activeTraceId,
  cot,
  filteredList,
  ghostCompletion,
  ghostSuggestion,
  handleVoice,
  inputRef,
  isThinking,
  mode,
  navigateToItem,
  onSubmit,
  placeholder,
  query,
  scrollContainerRef,
  selectedIndex,
  setQuery,
  toggleActions,
}: FloatingOmniAgentProps) {
  const showResults = mode === 'navigation' || mode === 'actions' || isThinking || cot.length > 0;

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Tab' && ghostSuggestion) {
      event.preventDefault();
      setQuery(ghostSuggestion);
      return;
    }

    if (event.key === 'Enter' && mode === 'default' && query.trim()) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex pointer-events-none flex-col items-center justify-end pb-8">
      {showResults ? (
        <div className="pointer-events-auto mb-4 w-full max-w-[500px] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="mx-4 overflow-hidden rounded-3xl border border-glass-border bg-glass-surface shadow-xl backdrop-blur-md md:mx-0">
            <div className="relative z-10">
              {!isThinking && cot.length === 0 ? (
                <div
                  ref={scrollContainerRef}
                  className="custom-scrollbar scroll-smooth max-h-[200px] space-y-1 overflow-y-auto p-2"
                >
                  <div className="mb-1 flex items-center justify-between border-b border-glass-border/50 px-4 py-2">
                    <span className="text-2xs font-black uppercase tracking-widest text-muted-foreground/70">
                      {mode === 'navigation' ? 'Navegacion' : 'Acciones'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      <span className="text-3xs font-black uppercase tracking-tighter text-foreground">Live Insight</span>
                    </div>
                  </div>

                  {filteredList.length > 0 ? (
                    filteredList.map((item, index) => (
                      <button
                        key={`${item.label}-${index}`}
                        onClick={() => navigateToItem(item)}
                        className={cn(
                          'group flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-200',
                          index === selectedIndex
                            ? 'bg-primary/10 text-primary shadow-[inset_0_0_0_1px_rgba(var(--primary),0.2)]'
                            : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                        )}
                      >
                        <div
                          className={cn(
                            'rounded-xl bg-muted/60 p-2 transition-[background-color,color,box-shadow,transform] duration-200',
                            index === selectedIndex && 'bg-primary/20',
                          )}
                        >
                          <item.icon
                            size={16}
                            className={cn('transition-transform duration-300', index === selectedIndex && 'scale-110')}
                          />
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-bold uppercase tracking-tight">{item.label}</span>
                        </div>
                        {index === selectedIndex ? <ChevronRight size={16} className="opacity-50" /> : null}
                      </button>
                    ))
                  ) : (
                    <div className="p-10 text-center text-2xs font-black uppercase tracking-widest text-muted-foreground opacity-50">
                      Sin resultados inteligentes
                    </div>
                  )}
                </div>
              ) : null}

              {isThinking || cot.length > 0 ? (
                <div className="bg-glass-surface/50 p-8 backdrop-blur-md">
                  <div className="mb-6 flex items-center gap-2 border-b border-glass-border pb-4">
                    <Sparkles size={14} className="animate-pulse text-primary" />
                    <span className="text-2xs font-black uppercase tracking-widest text-foreground">Actividad del Agente</span>
                  </div>
                  <div className="space-y-4">
                    {cot.map((step, index) => (
                      <div
                        key={`${step}-${index}`}
                        className="animate-in flex items-start gap-4 text-label font-medium fade-in slide-in-from-left-2 transition-[opacity,transform,color] duration-200"
                      >
                        <div
                          className={cn(
                            'mt-1 h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor]',
                            index === cot.length - 1 ? 'bg-primary' : 'bg-muted-foreground/30',
                          )}
                        />
                        <div className="flex-1">
                          <span
                            className={cn(
                              'uppercase tracking-tight leading-relaxed',
                              index === cot.length - 1 ? 'font-black text-foreground' : 'text-muted-foreground/40',
                            )}
                          >
                            {step}
                          </span>
                          {index === cot.length - 1 ? (
                            <div className="mt-1 text-[8px] font-mono text-primary/40">
                              Estado: Procesando | Traza: {activeTraceId ?? 'trace-pending'}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-auto w-full max-w-[520px] animate-in slide-in-from-bottom-10 fade-in duration-500">
        <div
          className={cn(
            'group mx-4 flex items-center rounded-full border p-2 shadow-xl transition-[background-color,border-color,box-shadow,transform,opacity] duration-300 md:mx-0',
            'bg-glass-surface border-glass-border ring-4 ring-border/40 backdrop-blur-md',
            'hover:border-primary/30 hover:ring-primary/5',
          )}
        >
          <div className="relative z-10 flex w-full items-center">
            <button
              aria-label="Toggle actions"
              className={cn(
                'mr-2 z-10 flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-[background-color,color,box-shadow,transform,opacity] duration-200',
                mode === 'actions'
                  ? 'rotate-45 bg-primary text-primary-foreground'
                  : 'bg-muted/60 text-muted-foreground hover:bg-primary hover:text-primary-foreground',
              )}
              onClick={toggleActions}
            >
              <Plus size={20} />
            </button>

            <div className="relative flex h-10 flex-1 items-center">
              {ghostSuggestion ? (
                <div className="pointer-events-none absolute inset-0 flex items-center px-2 text-[15px] font-bold uppercase tracking-tight">
                  <span className="invisible">{query}</span>
                  <span className="text-muted-foreground/30">{ghostCompletion}</span>
                </div>
              ) : null}
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={placeholder}
                aria-label={placeholder || "Search or command"}
                className="relative z-10 w-full border-none bg-transparent px-2 text-[15px] font-bold uppercase tracking-tight text-foreground outline-none placeholder:text-muted-foreground/40"
                autoFocus
              />
            </div>

            <button
              aria-label="Voice input"
              className={cn(
                'ml-1 flex h-10 w-10 items-center justify-center rounded-full transition-[background-color,color,box-shadow,transform,opacity] duration-200',
                mode === 'voice'
                  ? 'animate-pulse bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:bg-muted/70',
              )}
              onClick={handleVoice}
            >
              <Mic size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
