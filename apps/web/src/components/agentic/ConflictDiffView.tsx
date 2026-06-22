import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, ChevronRight, Hash } from 'lucide-react';

interface DiffValue {
  original: unknown;
  extracted: unknown;
  isDifferent: boolean;
  label: string;
  confidence: number;
}

interface ConflictDiffViewProps {
  data: Record<string, DiffValue>;
  onApprove?: (key: string) => void;
  onCorrection: (key: string, newValue: unknown) => void;
  className?: string;
}

export const ConflictDiffView = ({
  data,
  onApprove,
  onCorrection,
  className
}: ConflictDiffViewProps) => {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <header className="flex items-center justify-between border-b border-border/60 px-4 py-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-warning" />
          <h3 className="text-sm font-black uppercase tracking-widest">Discrepancias Detectadas</h3>
        </div>
        <span className="text-2xs font-mono text-muted-foreground uppercase">Modo Auditoría</span>
      </header>

      <div className="space-y-2 p-2">
        {Object.entries(data).map(([key, item]) => (
          <motion.div
            key={key}
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "group relative overflow-hidden rounded-xl border transition-[background-color,border-color,box-shadow,transform,color] duration-200",
              item.isDifferent 
                ? "bg-warning-subtle border-warning-subtle shadow-[0_0_20px_rgba(245,158,11,0.05)]"
                : "bg-success-subtle border-success-subtle"
            )}
          >
            <div className="p-4 flex flex-col md:flex-row md:items-center gap-4">
              {/* Label & Icon */}
              <div className="flex items-center gap-3 w-full md:w-1/4">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-inner",
                  item.isDifferent ? "bg-warning-muted text-warning" : "bg-success-muted text-success"
                )}>
                  {item.isDifferent ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                </div>
                <div className="min-w-0">
                  <p className="text-2xs font-black uppercase tracking-tighter text-muted-foreground opacity-60">{item.label}</p>
                  <p className="text-xs font-mono font-bold truncate text-foreground/80">{key}</p>
                </div>
              </div>

              {/* Comparison Values */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {/* Original (Agent Prediction) */}
                <div className="space-y-1">
                  <span className="text-3xs font-black text-muted-foreground/40 uppercase tracking-widest flex items-center gap-1">
                    <ChevronRight size={10} /> Extracción Agente
                  </span>
                  <div className="rounded-md border border-border bg-muted/50 px-3 py-2 font-mono text-xs text-foreground">
                    {String(item.extracted)}
                  </div>
                </div>

                {/* Conflict/Value Display */}
                {item.isDifferent && (
                  <div className="space-y-1">
                    <span className="text-3xs font-black text-warning-muted uppercase tracking-widest flex items-center gap-1">
                      <ChevronRight size={10} /> Valor Original (PDF)
                    </span>
                    <div className="bg-warning-muted rounded-md px-3 py-2 border border-warning-muted font-mono text-xs text-warning">
                      {String(item.original)}
                    </div>
                  </div>
                )}
              </div>

              {/* Confidence & Actions */}
              <div className="flex items-center gap-4 md:w-1/5 justify-end">
                <div className="text-right">
                  <p className="text-3xs font-black text-muted-foreground/40 uppercase">Confianza</p>
                  <p className={cn(
                    "text-xs font-mono font-bold",
                    item.confidence > 0.9 ? "text-success" : "text-warning"
                  )}>
                    {(item.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                
                {item.isDifferent ? (
                  <button 
                    onClick={() => onCorrection(key, item.original)}
                    className="h-10 w-10 rounded-full bg-warning text-[var(--color-text-inverse)] flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                  >
                    <Hash size={18} />
                  </button>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-success-soft text-success flex items-center justify-center border border-success-subtle">
                    <CheckCircle2 size={18} />
                  </div>
                )}
              </div>
            </div>

            {/* Progress/Confidence Bar */}
            <div className="absolute bottom-0 left-0 h-[2px] bg-warning-soft w-full">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.confidence * 100}%` }}
                className={cn(
                  "h-full",
                  item.confidence > 0.9 ? "bg-success" : "bg-warning"
                )}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
