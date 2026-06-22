import { Download, TrendingUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, n } from '@/lib/utils';
import { useFinancialsEngine } from '../hooks/useFinancialsEngine';
import { Card, CardContent } from '@/components/ui/card';
import { DrillDownPanel } from './drill-down/DrillDownPanel';

export const FinancialsView = () => {
  const { 
    activeReport, 
    setActiveReport, 
    drillDownId, 
    openDrillDown, 
    closeDrillDown, 
    reportData,
    period
  } = useFinancialsEngine();

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative font-sans text-foreground">
      
      {/* 1. Technical Toolbar - CommandDeck Style */}
      <header className="px-4 py-3 sm:px-6 sm:py-5 border-b border-border bg-background flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 shrink-0 z-50 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-4 sm:gap-6 relative z-10 w-full md:w-auto group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(var(--premium-info-rgb),0.16)] bg-gradient-to-br from-[var(--premium-action-cyan)]/20 to-[var(--premium-action-blue)]/20 shadow-sm sm:h-12 sm:w-12 sm:rounded-2xl">
                <TrendingUp size={20} className="text-[var(--premium-action-cyan)] opacity-80 transition-opacity duration-200 group-hover:opacity-100 sm:h-6 sm:w-6" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-foreground leading-none truncate">
                    Estados Financieros
                </h1>
                <div className="flex items-center gap-3 mt-1 sm:mt-1.5">
                    <div className="flex bg-muted/50 p-0.5 rounded-lg border border-border shadow-sm overflow-x-auto no-scrollbar max-w-[200px] xs:max-w-none">
                        {(['pnl', 'balance', 'cashflow', 'equity'] as const).map((id) => (
                            <Button
                                key={id}
                                variant="ghost" 
                                size="sm"
                                onClick={() => setActiveReport(id)}
                                className={cn(
                                    "flex h-6 items-center rounded-md px-2 text-2xs font-black uppercase tracking-widest whitespace-nowrap transition-colors duration-200 sm:px-3 sm:text-xs",
                                    activeReport === id ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {id === 'pnl' ? 'Resultados' : 
                                 id === 'balance' ? 'Situación' : 
                                 id === 'cashflow' ? 'Flujo' : 'Patrimonio'}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end relative z-10">
            <div className="flex items-center gap-2 bg-muted/50 px-4 py-1.5 rounded-lg border border-border">
                <span className="text-label font-black uppercase">{period}</span>
                <ChevronDown size={12} className="opacity-40" />
            </div>
            <Button variant="outline" size="sm" className="btn-soft"><Download size={14} /> NIIF PDF</Button>
        </div>
      </header>

      {/* 2. Dynamic Report Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-10 lg:p-16 bg-background custom-scrollbar animate-entrance pb-32">
          <div className="max-w-5xl mx-auto">
              
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10 mb-8 md:mb-16 border-l-4 md:border-l-8 border-[rgba(var(--premium-info-rgb),0.50)] pl-4 md:pl-10">
                  <div>
                      <h2 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase">
                          {activeReport === 'pnl' ? 'Estado de Resultados' : 'Situación Financiera'}
                      </h2>
                      <p className="text-label font-bold text-muted-foreground uppercase tracking-widest mt-2 sm:mt-4">Reporte auditado • Cumplimiento SBS/NIIF</p>
                  </div>
                  <div className="flex w-full items-center justify-between gap-6 rounded-xl border border-border/50 bg-card p-4 shadow-sm sm:w-auto sm:justify-start sm:p-6">
                      <div className="text-right">
                          <p className="text-label font-black uppercase text-muted-foreground">Utilidad Neta</p>
                          <p className="text-2xl sm:text-3xl font-black font-mono tabular-nums tracking-tighter text-foreground">S/ 93,000</p>
                      </div>
                      <TrendingUp size={24} strokeWidth={3} className="text-primary/60" />
                  </div>
              </div>

              <Card className="overflow-hidden border-border/40 shadow-sm">
                  <CardContent className="p-0">
                      <table className="w-full text-left border-separate border-spacing-0">
                          <thead className="bg-muted/30">
                              <tr>
                                  <th className="px-10 py-5 text-label font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border/50">Concepto / Partida</th>
                                  <th className="px-10 py-5 text-label font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border/50 text-right">Monto Neto</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-border/20">
                              {reportData.map((line) => (
                                  <tr 
                                    key={line.id} 
                                    className={cn(
                                        "group cursor-pointer transition-colors duration-200",
                                        line.isTotal ? "bg-foreground text-background hover:opacity-90" : "hover:bg-muted/20"
                                    )}
                                    onClick={() => !line.isTotal && openDrillDown(line.id)}
                                  >
                                      <td className="px-10 py-6">
                                          <div className="flex items-center gap-4">
                                              <span className={cn(
                                                  "inline-block uppercase tracking-tight transition-[color,transform,opacity] duration-200",
                                                  line.isTotal ? "font-black text-sm" : "font-bold text-sm group-hover:translate-x-1",
                                                  line.level > 0 && "ml-8 opacity-60"
                                              )}>
                                                  {line.label}
                                              </span>
                                              {!line.isTotal && (
                                                  <div className="h-1 w-1 rounded-full bg-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                              )}
                                          </div>
                                      </td>
                                      <td className="px-10 py-6 text-right">
                                          <span className={cn(
                                              "font-black font-mono tracking-tighter tabular-nums transition-[color,opacity] duration-200",
                                              line.isTotal ? "text-lg" : "text-sm opacity-80 group-hover:opacity-100"
                                          )}>
                                              {n(line.amount)}
                                          </span>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </CardContent>
              </Card>
          </div>
      </main>

      {/* 3. Detail Layer: Drill-Down */}
      <DrillDownPanel 
        isOpen={!!drillDownId} 
        onClose={closeDrillDown} 
        title={reportData.find(l => l.id === drillDownId)?.label || ''} 
      />
    </div>
  );
};
