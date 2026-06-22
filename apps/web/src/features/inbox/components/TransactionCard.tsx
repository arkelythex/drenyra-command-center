import { Sparkles, Check, FileText, BrainCircuit, ChevronDown, MessageSquare, MoreHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { n } from '@/lib/utils';
import { Transaction } from '../hooks/useInbox';

interface TransactionCardProps {
  transaction: Transaction;
  onConfirm: (id: string) => void;
}

export const TransactionCard = ({ transaction, onConfirm }: TransactionCardProps) => {
  return (
    <Card className="group relative overflow-hidden">
        <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row">
                <div className="flex-1 p-8 space-y-8">
                    {/* Header: Identity & Value */}
                    <div className="flex justify-between items-start border-b border-border/50 pb-6">
                        <div className="space-y-1.5">
                            <h3 className="font-black text-lg text-foreground uppercase tracking-tight leading-tight">
                                {transaction.vendor}
                            </h3>
                            <div className="flex items-center gap-3 text-label font-bold text-muted-foreground uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><FileText size={12} /> CPE ELECTRÓNICO</span>
                                <span className="h-1 w-1 rounded-full bg-border" />
                                <span className="font-mono">{transaction.date}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-black font-mono text-foreground tabular-nums tracking-tighter">
                                {n(transaction.amount)}
                            </p>
                            <span className="text-xs font-black uppercase tracking-widest opacity-40">Validación SUNAT OK</span>
                        </div>
                    </div>

                    {/* AI Suggestions: Pure Monochrome Intelligence */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                        <div className="lg:col-span-7 space-y-4">
                            <div className="flex items-center gap-2">
                                <Sparkles size={12} className="text-foreground animate-pulse" />
                                <span className="text-label font-black text-muted-foreground uppercase tracking-[0.2em]">Sugerencia PCGE</span>
                            </div>
                            <div className="group/select flex cursor-pointer items-center gap-4 rounded-2xl border border-border bg-muted/30 p-4 transition-[background-color,border-color,box-shadow,transform] duration-200 hover:border-foreground/30">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-foreground uppercase truncate">{transaction.suggestedCategory}</p>
                                    <p className="text-label font-mono font-bold text-muted-foreground mt-1">Cuenta: {transaction.suggestedCode}</p>
                                </div>
                                <ChevronDown size={16} className="text-muted-foreground group-hover/select:text-foreground" />
                            </div>
                        </div>

                        <div className="lg:col-span-5 flex justify-end">
                            <Button size="lg" className="h-14 w-full bg-foreground text-background shadow-xl transition-[background-color,box-shadow,transform,opacity] duration-200 hover:bg-foreground/90 lg:w-48" onClick={() => onConfirm(transaction.id)}>
                                <Check size={18} strokeWidth={3} className="mr-2" />
                                Confirmar
                            </Button>
                        </div>
                    </div>

                    {/* Agent Reason */}
                    <div className="pt-6 border-t border-border/50 flex items-start gap-4">
                        <div className="p-2 bg-muted rounded-xl border border-border shrink-0">
                            <BrainCircuit size={16} strokeWidth={1.5} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-label font-black uppercase tracking-widest text-foreground">Razonamiento</p>
                            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                                Gasto recurrente identificado. No se detectan anomalías en el periodo fiscal actual.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-muted/10 border-t sm:border-t-0 sm:border-l border-border/50 p-4 flex flex-row sm:flex-col gap-2 justify-center sm:w-16 items-center">
                    <button aria-label="Mensaje" className="btn-soft p-2 text-muted-foreground transition-[background-color,color,border-color,box-shadow,transform] duration-200 hover:text-foreground"><MessageSquare size={18} /></button>
                    <button aria-label="Más opciones" className="btn-soft p-2 text-muted-foreground transition-[background-color,color,border-color,box-shadow,transform] duration-200 hover:text-foreground"><MoreHorizontal size={18} /></button>
                </div>
            </div>
        </CardContent>
    </Card>
  );
};
