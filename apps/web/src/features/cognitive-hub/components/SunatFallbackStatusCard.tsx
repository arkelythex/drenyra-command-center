import { AlertTriangle, Loader2, ShieldCheck, Smartphone } from 'lucide-react';
import { useSunatFallbackProbe } from '../api/useSunatFallbackProbe';

export function SunatFallbackStatusCard() {
  const { runProbe, result, isLoading, error } = useSunatFallbackProbe();

  return (
    <div className="rounded-xl border border-amber-400/20 bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-[var(--premium-success)]" />
          <p className="text-2xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Fallback Agentic · Dev Mode</p>
        </div>
        {isLoading ? <Loader2 size={14} className="animate-spin text-muted-foreground" /> : null}
      </div>
      <p className="mb-3 text-2xs font-medium text-muted-foreground">
        Utilidades de prueba operativa (HITL/fallback), fuera de navegación principal.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void runProbe('normal')}
          disabled={isLoading}
          className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-2xs font-semibold uppercase tracking-[0.08em] text-muted-foreground transition hover:bg-muted disabled:opacity-60"
        >
          Probar Fallback
        </button>
        <button
          type="button"
          onClick={() => void runProbe('hitl')}
          disabled={isLoading}
          className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-2xs font-semibold uppercase tracking-[0.08em] text-muted-foreground transition hover:bg-muted disabled:opacity-60"
        >
          Simular HITL
        </button>
      </div>

      {result ? (
        <div className="mt-3 space-y-2 rounded-xl border border-border bg-muted/40 p-3 text-label text-foreground">
          <p>
            Pasos: <span className="font-semibold">{result.trace.steps.join(' -> ')}</span>
          </p>
          <p>Duración: {result.trace.durationMs} ms</p>
          {result.hitl ? (
            <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-2 text-amber-600">
              <div className="mb-1 flex items-center gap-1">
                <AlertTriangle size={12} />
                <span className="font-bold uppercase tracking-wide">HITL requerido</span>
              </div>
              <p>{result.hitl.message}</p>
              <p className="mt-1 flex items-center gap-1 text-2xs uppercase tracking-widest">
                <Smartphone size={10} />
                {result.hitl.channel}: {result.hitl.screenshotRef}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="mt-2 text-label text-destructive">{error}</p> : null}
    </div>
  );
}
