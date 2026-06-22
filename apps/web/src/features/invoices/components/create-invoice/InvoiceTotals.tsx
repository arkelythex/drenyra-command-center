import { Receipt, Info, ShieldCheck } from 'lucide-react';
import type { Currency } from "@arkelythex/domain";
import { n } from "@/lib/utils";

interface Props {
  totals: {
    subtotal: number;
    igvAmount: number;
    totalAmount: number;
  };
  currency: Currency;
}

export const InvoiceTotals = ({ totals, currency }: Props) => {
  return (
    <div className="relative group/totals overflow-hidden">
      {/* Background Ambience: Kinetic Glow */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-[rgba(var(--premium-info-rgb),0.10)] blur-overlay rounded-full pointer-events-none group-hover/totals:bg-[rgba(var(--premium-info-rgb),0.20)] transition-colors duration-700" />
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-[rgba(var(--premium-success-rgb),0.05)] blur-overlay rounded-full pointer-events-none" />

      <div className="relative space-y-8 rounded-2xl border border-border bg-card/70 p-10 shadow-xl shadow-black/8 backdrop-blur-md">
        
        {/* Header: Institutional Status */}
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-[rgba(var(--premium-info-rgb),0.10)] rounded-2xl flex items-center justify-center text-[var(--premium-action-cyan)] border border-[rgba(var(--premium-info-rgb),0.20)] shadow-inner">
                 <Receipt size={24} strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                 <span className="text-label uppercase tracking-[0.25em] font-black text-foreground/80">Liquidación Final</span>
                 <span className="text-xs text-muted-foreground/50 font-bold uppercase tracking-widest">Resumen Impositivo Estándar</span>
              </div>
           </div>
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(var(--premium-success-rgb),0.10)] border border-[rgba(var(--premium-success-rgb),0.20)] text-[var(--premium-success)]">
              <ShieldCheck size={12} />
              <span className="text-2xs font-black uppercase tracking-widest">Validez Sunat</span>
           </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-5">
            <div className="flex justify-between items-center group/row">
              <div className="flex items-center gap-2">
                 <div className="w-1 h-1 rounded-full bg-muted-foreground/30 group-hover/row:bg-[var(--premium-action-blue)] transition-colors" />
                 <span className="text-label font-black uppercase tracking-[0.15em] text-muted-foreground/60">Subtotal Operación</span>
              </div>
              <span className="text-sm font-mono font-bold tracking-tight text-foreground/90 tabular-nums">
                {n(totals.subtotal, currency)}
              </span>
            </div>

            <div className="flex justify-between items-center group/row">
              <div className="flex items-center gap-2">
                 <div className="w-1 h-1 rounded-full bg-muted-foreground/30 group-hover/row:bg-[var(--premium-action-blue)] transition-colors" />
                 <span className="text-label font-black uppercase tracking-[0.15em] text-muted-foreground/60">I.G.V. Aplicado (18%)</span>
              </div>
              <span className="text-sm font-mono font-bold tracking-tight text-foreground/90 tabular-nums">
                {n(totals.igvAmount, currency)}
              </span>
            </div>
        </div>

        {/* Highlighted Divider */}
        <div className="relative py-2">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-border/40 border-dashed" />
            </div>
            <div className="relative flex justify-center">
                <div className="bg-card/80 backdrop-blur-md px-4 py-1 rounded-full border border-border/40 shadow-sm">
                    <Info size={10} className="text-muted-foreground/40" />
                </div>
            </div>
        </div>
        
        {/* Grand Total: The Hook */}
        <div className="flex justify-between items-end pt-2">
          <div className="flex flex-col gap-1">
              <span className="text-sm font-black uppercase tracking-[0.3em] text-[var(--premium-action-cyan)]">Total Neto a Pagar</span>
              <span className="text-xs text-muted-foreground/40 font-bold uppercase tracking-widest">Monto expresado en {currency === 'PEN' ? 'Soles' : 'Dólares'}</span>
          </div>
          <div className="flex flex-col items-end">
              <span className="text-5xl font-black text-foreground tabular-nums tracking-tighter drop-shadow-xl">
                {n(totals.totalAmount, currency)}
              </span>
          </div>
        </div>

        {/* Institutional Footer */}
        <div className="pt-4 border-t border-border/20 flex items-center justify-center gap-6">
            <div className="flex cursor-help items-center gap-2 grayscale brightness-150 opacity-20 transition-[opacity,filter] duration-300 hover:opacity-100 hover:grayscale-0">
                <div className="w-3 h-3 bg-[var(--premium-action-blue)] rounded-sm" />
                <span className="text-2xs font-black uppercase tracking-tighter">ARKELYTHEX CORE</span>
            </div>
            <div className="flex cursor-help items-center gap-2 grayscale brightness-150 opacity-20 transition-[opacity,filter] duration-300 hover:opacity-100 hover:grayscale-0">
                <div className="w-3 h-3 bg-red-600 rounded-sm" />
                <span className="text-2xs font-black uppercase tracking-tighter">SUNAT CERTIFIED</span>
            </div>
        </div>
      </div>
    </div>
  );
};
