import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const TaxAdvisoryCard = () => {
  return (
    <div className="relative group cursor-default overflow-hidden rounded-2xl border border-border/60 bg-card p-8 text-foreground shadow-sm transition-[border-color,background-color,box-shadow] duration-200 hover:border-border/80 hover:bg-card/95">
        <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
                <div className="rounded-xl border border-border/60 bg-muted/30 p-2">
                    <ShieldCheck size={18} className="text-primary" />
                </div>
                <span className="text-label font-black uppercase tracking-[0.3em] text-muted-foreground">
                    Revisión asistida
                </span>
            </div>

            <p className="text-lg font-medium leading-relaxed tracking-tight text-foreground">
                Se detectó que el saldo de la cuenta <span className="font-black underline decoration-border decoration-2 underline-offset-4">4011</span> podría reducir la cuota actual en un <span className="font-black">5.2%</span>, sujeto a revisión contable.
            </p>

            <div className="pt-4 flex flex-wrap gap-3">
                <Button className="h-10 rounded-xl bg-foreground px-6 text-label font-black uppercase tracking-widest text-background shadow-sm transition-[background-color,box-shadow,transform,opacity] duration-200 active:scale-95 hover:bg-foreground/95">
                    Ver Proyección
                </Button>
                <Button variant="outline" className="h-10 rounded-xl border-border/60 bg-background px-6 text-label font-black uppercase tracking-widest text-foreground transition-[background-color,border-color,transform,opacity] duration-200 active:scale-95 hover:bg-muted/40">
                    Revisar supuesto
                </Button>
            </div>
        </div>
    </div>
  );
};
