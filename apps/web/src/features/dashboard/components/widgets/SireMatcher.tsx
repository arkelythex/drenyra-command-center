import { ShieldCheck, AlertCircle, CheckCircle2, Search, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { tokensToClasses } from '@/lib/design-tokens';
import { useQuery } from '@tanstack/react-query';
import { useActiveCompanyContext } from '@/lib/use-active-company-context';
import { dashboardSummaryQueryOptions } from '../../dashboard.query-options';

export const SireMatcher = () => {
    const {
        companyContext: { companyId },
    } = useActiveCompanyContext();

    const { data, isLoading: loading } = useQuery(dashboardSummaryQueryOptions(companyId));

    const summary = data?.status ?? {
        matched: 0,
        unmatched: 0,
        rejected: 0,
        totalInvoices: 0,
        matchRate: 0,
    };

    const discrepancyCount = summary.unmatched + summary.rejected;
    const isMatch = discrepancyCount === 0 && summary.totalInvoices > 0;

    const formatPercent = (value: number) => `${value.toFixed(1)}%`;

    return (
        <div className={cn(tokensToClasses.borderRadius('modal'), "group relative h-full overflow-hidden border border-border/50 bg-card p-6 transition-[border-color,box-shadow] duration-200 sm:p-7", tokensToClasses.shadow('modal'), "shadow-sm hover:border-border/70 hover:shadow-md")}>
            {/* Background Institutional Seal */}
            <div className="absolute top-0 right-0 opacity-[0.02] text-foreground pointer-events-none">
                <ShieldCheck size={300} strokeWidth={0.5} />
            </div>

            <div className="relative z-10 mb-7 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
                    <Search size={18} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                    <Label className={cn(tokensToClasses.typography('label'), "font-black text-foreground uppercase tracking-[0.2em] leading-tight")}>Monitor Inteligente SIRE</Label>
                    <span className={cn(tokensToClasses.typography('xs'), "text-muted-foreground font-bold uppercase tracking-widest mt-0.5")}>Validación RVIE / RCE 2026</span>
                </div>
            </div>

            <div className="relative z-10 space-y-5">
                {/* Comparison Block */}
                <div className={cn(tokensToClasses.borderRadius('card'), "flex flex-col items-center justify-between gap-4 border border-border bg-muted/20 p-6 sm:flex-row sm:gap-0")}>
                    <div className="space-y-3 w-full sm:w-auto text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                            <Database size={10} className="text-primary" />
                            <p className={cn(tokensToClasses.typography('xs'), "text-muted-foreground uppercase font-bold tracking-[0.2em]")}>MATCH RATE SIRE</p>
                        </div>
                        <p className="text-lg font-black text-foreground font-mono tracking-tighter tabular-nums">
                            {loading ? '...' : formatPercent(summary.matchRate)}
                        </p>
                    </div>

                    <div className="h-px w-full sm:w-px sm:h-12 bg-border mx-8" />

                    <div className="space-y-3 w-full sm:w-auto text-center sm:text-right">
                        <div className="flex items-center justify-center sm:justify-end gap-2">
                            <p className={cn(tokensToClasses.typography('xs'), "text-muted-foreground uppercase font-bold tracking-[0.2em]")}>COMPROBANTES</p>
                            <ShieldCheck size={10} className="text-success" />
                        </div>
                        <p className="text-lg font-black text-foreground font-mono tracking-tighter tabular-nums">
                            {loading ? '...' : `${summary.matched}/${summary.totalInvoices || 0}`}
                        </p>
                    </div>
                </div>

                {/* Alert / Status Block */}
                <div className={cn(
                    tokensToClasses.borderRadius('modal'),
                    "flex flex-col items-center gap-5 border p-2 transition-[background-color,border-color] duration-200 sm:flex-row",
                    isMatch
                        ? "border-success-subtle bg-success-subtle pr-8"
                        : "border-danger-subtle bg-danger-subtle pr-8"
                )}>
                    <div className={cn(
                        tokensToClasses.borderRadius('card'),
                        "ml-2 flex h-16 w-16 shrink-0 items-center justify-center shadow-sm transition-transform duration-200 hover:scale-[1.03] sm:ml-0",
                        isMatch ? "bg-success text-[var(--text-primary)]" : "bg-danger text-[var(--text-primary)]"
                    )}>
                        {isMatch ? <CheckCircle2 size={24} strokeWidth={2.5} /> : <AlertCircle size={24} strokeWidth={2.5} />}
                    </div>

                    <div className="min-w-0 flex-1 py-3 text-center sm:py-0 sm:text-left">
                        <p className={cn(tokensToClasses.typography('2xs'), "font-black uppercase tracking-[0.2em] text-foreground mb-2")}>
                            {isMatch ? "CONCILIACIÓN INTEGRAL" : "DISCREPANCIA TÉCNICA"}
                        </p>
                        {!isMatch && (
                            <div className="flex flex-col sm:flex-row items-center gap-2">
                                <div className={cn(tokensToClasses.typography('2xs'), "font-bold text-destructive uppercase tracking-tight flex items-center gap-2")}>
                                    <span>INCONSISTENCIAS:</span>
                                    <span className="rounded-full border border-danger-subtle bg-background px-2 py-0.5 text-xs font-black text-danger">{discrepancyCount}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {!isMatch && (
                        <button onClick={() => alert("Generando reporte de inconsistencias para SIRE 2026...")} className={cn(tokensToClasses.typography('2xs'), "w-full rounded-xl bg-danger px-5 py-2.5 font-bold uppercase tracking-[0.15em] text-[var(--text-primary)] shadow-sm transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md sm:w-auto")}>
                            CORREGIR AHORA
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
