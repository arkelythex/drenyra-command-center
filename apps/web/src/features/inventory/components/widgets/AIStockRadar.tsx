import { Boxes, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Prediction } from '../../types/inventory.types';

interface Props {
  predictions: Prediction[];
}

export const AIStockRadar = ({ predictions }: Props) => {
  return (
    <div className="bg-card border border-border/40 shadow-sm p-6 relative overflow-hidden group" style={{ borderRadius: '2rem' }}>
      {/* Background Graphic */}
      <div className="absolute -top-10 -right-10 p-4 opacity-[0.02] dark:opacity-[0.05] group-hover:opacity-[0.05] dark:group-hover:opacity-[0.08] transition-opacity duration-700 pointer-events-none">
        <Boxes size={240} />
      </div>

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-sm">
            <AlertTriangle size={24} strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-base font-black tracking-wide text-foreground">Riesgo de stock</h3>
            <p className="text-label font-bold text-muted-foreground uppercase tracking-widest">Cobertura estimada para 14 días</p>
          </div>
        </div>
        <Button size="sm" variant="ghost" className="h-9 rounded-xl border border-transparent px-4 text-xs font-black uppercase tracking-widest text-muted-foreground transition-[background-color,border-color,color,transform] duration-200 hover:border-border/40 hover:bg-muted/30 hover:text-foreground">
          Ver detalle <ArrowRight size={12} className="ml-2" />
        </Button>
      </div>

      <div className="grid gap-3 relative z-10">
        {predictions.map((pred, idx) => (
          <div key={idx} className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border/30 bg-muted/20 p-4 transition-[background-color,border-color,box-shadow] duration-200 hover:border-primary/20 hover:bg-muted/30 sm:flex-row sm:items-center dark:bg-muted/10 dark:hover:bg-muted/20">
            <div className="flex items-center gap-5">
              <div className={cn("h-3 w-3 rounded-full shadow-sm ring-2 ring-background", pred.status === 'Critical' ? "bg-danger shadow-danger-glow" : pred.status === 'Warning' ? "bg-warning shadow-warning-glow" : "bg-success shadow-success-glow")} />
              <div>
                <p className="text-sm font-black text-foreground tracking-tight">{pred.item}</p>
                <div className="flex items-center gap-1.5 mt-1">
                     <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{pred.status === 'Critical' ? 'Se agota en' : 'Cobertura'}:</span>
                     <span className={cn("font-mono font-black text-sm", pred.status === 'Critical' ? "text-danger" : "text-foreground")}>{pred.days} días</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-3">
                <div className="w-24 sm:w-32 h-2.5 bg-muted/40 rounded-full overflow-hidden border border-border/10">
                  <div className={cn("h-full rounded-full transition-[width,background-color,box-shadow] duration-700", pred.usage === 'High' ? "w-[90%] bg-primary shadow-[0_0_8px_currentColor]" : "w-[40%] bg-muted-foreground/40")} />
                </div>
                <span className="text-label font-mono font-bold text-muted-foreground min-w-[30px] text-right">
                  {pred.usage === 'High' ? '90%' : '40%'}
                </span>
              </div>
              <Button size="sm" className={cn("h-8 rounded-xl px-4 text-3xs font-black uppercase tracking-widest shadow-sm transition-[background-color,border-color,color,transform,box-shadow] duration-200", pred.status === 'Critical' ? "bg-foreground text-background hover:bg-foreground/90" : "border border-border bg-background text-foreground hover:border-foreground/30 hover:bg-muted")}>
                {pred.action}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
