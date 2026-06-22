'use client';

import { LayoutDashboard, LineChart as LineChartIcon, Menu, Plus, Search, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/atoms/text';
import { MobileTabNavigation } from '@/components/layout/MobileTabNavigation';
import { cn } from '@/lib/utils';
import { CASHFLOW_TABS } from './constants';

interface CashflowBoardHeaderProps {
  activeTab: 'tablero' | 'prevision';
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onTabChange: (id: string) => void;
  onOpenMobileSidebar: () => void;
  onSetBoardView: () => void;
  onSetForecastView: () => void;
  totalCashLabel: string;
  isUsingFallback: boolean;
  isLoading: boolean;
  viewMode: 'board' | 'forecast';
  modalBackdropClassName: string;
  glassBackdropClassName: string;
  iconBorderRadius: string;
  stickyZIndex: number;
}

export function CashflowBoardHeader({
  activeTab,
  searchQuery,
  onSearchChange,
  onTabChange,
  onOpenMobileSidebar,
  onSetBoardView,
  onSetForecastView,
  totalCashLabel,
  isUsingFallback,
  isLoading,
  viewMode,
  modalBackdropClassName,
  glassBackdropClassName,
  iconBorderRadius,
  stickyZIndex,
}: CashflowBoardHeaderProps): JSX.Element {
  return (
    <>
      <MobileTabNavigation
        tabs={CASHFLOW_TABS}
        activeTab={activeTab}
        onTabChange={onTabChange}
        className="left-auto right-4 top-4"
      />

      <div className="relative z-40 mt-14 flex flex-col gap-6 border-b border-border/50 bg-background/40 px-4 py-4 backdrop-blur-sm sm:hidden">
        <div className="flex w-full items-center gap-2">
          <div className="group relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground transition-colors group-focus-within:text-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar movimiento o concepto"
              className="h-10 w-full rounded-xl border-border/60 bg-card pl-10 text-label font-bold uppercase tracking-wider placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>

          <div className="flex items-center gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background shadow-sm transition-[background-color,box-shadow,transform] hover:scale-[1.03] hover:bg-foreground/90 active:scale-95">
              <Plus size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      <header
        className={`sticky top-0 hidden shrink-0 flex-col gap-6 border-b border-border/60 bg-background/80 px-6 py-4 sm:flex md:flex-row md:items-center md:justify-between ${modalBackdropClassName}`}
        style={{ zIndex: stickyZIndex }}
      >
        <div className="relative z-10 flex w-full items-center gap-5 md:w-auto">
          <Button
            onClick={onOpenMobileSidebar}
            variant="outline"
            size="icon"
            aria-label="Menú"
            className="h-10 w-10 shrink-0 rounded-xl border-border/50 bg-card hover:bg-card/80 lg:hidden"
          >
            <Menu className="h-5 w-5 text-muted-foreground" />
          </Button>
          <div
            className="flex h-12 w-12 items-center justify-center border border-border bg-card shadow-sm"
            style={{ borderRadius: iconBorderRadius }}
          >
            <LineChartIcon size={22} className="text-primary" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="leading-none text-xl font-black tracking-tight text-foreground">
              Flujo de caja
            </h1>
            <div className="mt-1.5 flex items-center gap-3">
              <span className="rounded-full border border-border/50 bg-card px-2.5 py-1 text-2xs font-black uppercase tracking-[0.22em] text-muted-foreground">
                {isUsingFallback ? 'Fallback local' : 'Fuente bancaria'}
              </span>
              {isLoading ? (
                <span className="text-2xs font-black uppercase tracking-[0.22em] text-muted-foreground/70">
                  Actualizando
                </span>
              ) : null}
              <div className={`rounded-lg border border-border/50 bg-muted/30 p-0.5 shadow-sm ${glassBackdropClassName}`}>
                {(['board', 'forecast'] as const).map((view) => (
                  <Button
                    key={view}
                    variant="ghost"
                    size="sm"
                    onClick={view === 'board' ? onSetBoardView : onSetForecastView}
                    className={cn(
                      'flex h-7 items-center gap-1.5 rounded-md px-3 text-xs font-black uppercase tracking-widest transition-[background-color,color,box-shadow,transform] duration-200',
                      viewMode === view
                        ? 'scale-[1.02] bg-foreground text-background shadow-md shadow-black/10'
                        : 'text-muted-foreground hover:bg-background/50 hover:text-foreground',
                    )}
                  >
                    {view === 'board' ? (
                      <LayoutDashboard size={10} className="mr-1.5" />
                    ) : (
                      <LineChartIcon size={10} className="mr-1.5" />
                    )}
                    {view === 'board' ? 'TABLERO' : 'PREVISIÓN'}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex w-full items-center gap-4 md:mt-0 md:w-auto">
          <div className="hidden items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-2 shadow-sm sm:flex">
            <div className="rounded-lg bg-[rgba(var(--premium-success-rgb),0.10)] p-1.5 text-[var(--premium-success)]">
              <Wallet size={14} />
            </div>
            <div className="flex flex-col">
              <span className="mb-0.5 text-xs font-black uppercase tracking-widest text-muted-foreground/70 leading-none">
                Liquidez bancaria
              </span>
              <Text variant="data" className="text-sm leading-none tabular-nums text-foreground">
                {totalCashLabel}
              </Text>
            </div>
          </div>
          <Button className="group relative h-10 overflow-hidden rounded-xl border border-border/40 bg-foreground px-6 text-label font-black uppercase tracking-widest text-background shadow-xl shadow-black/5 transition-[background-color,box-shadow,transform] hover:-translate-y-px hover:bg-foreground/90">
            <span className="relative z-10 flex items-center gap-2">
              <Plus size={14} strokeWidth={3} /> Nuevo Movimiento
            </span>
            <div className="absolute inset-0 translate-y-full bg-foreground/15 transition-transform duration-300 group-hover:translate-y-0" />
          </Button>
        </div>
      </header>
    </>
  );
}
