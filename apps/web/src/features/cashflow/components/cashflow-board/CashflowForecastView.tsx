'use client';

import { Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/atoms/text';
import type { ActualCashflowData, CashflowForecastData, CashflowProjectionData, CashflowVarianceData } from '../../api/cashflow.api';

interface CashflowForecastViewProps {
  actual: ActualCashflowData;
  projection: CashflowProjectionData;
  forecast: CashflowForecastData;
  variance: CashflowVarianceData;
  formatMoney: (amount: number) => string;
  formatPercentage: (value: number) => string;
  glassClassName: string;
}

export function CashflowForecastView({
  actual,
  projection,
  forecast,
  variance,
  formatMoney,
  formatPercentage,
  glassClassName,
}: CashflowForecastViewProps): JSX.Element {
  return (
    <div className="grid h-full gap-6 lg:grid-cols-[minmax(0,1.2fr)_380px]">
      <Card variant="default" className={`border-[var(--border-default)] bg-[var(--surface-1)] p-6 ${glassClassName}`}>
        <div className="flex items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div>
            <Text variant="label" className="text-label tracking-[0.24em] text-muted-foreground">
              FORECAST MENSUAL
            </Text>
            <Text variant="data" className="mt-2 text-2xl">
              Tendencia bancaria
            </Text>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-black/5 dark:bg-white/5">
            <Sparkles size={20} className="text-primary" strokeWidth={1.75} />
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {forecast.forecast.map((month) => (
            <div
              key={month.month}
              className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-black/5 dark:bg-white/5 px-4 py-3"
            >
              <div>
                <Text variant="label" className="text-2xs tracking-[0.2em] text-muted-foreground">
                  MES
                </Text>
                <p className="mt-1 text-sm font-black uppercase tracking-wide text-foreground">
                  {month.month}
                </p>
              </div>
              <div className="text-right">
                <Text variant="label" className="text-2xs tracking-[0.2em] text-muted-foreground">
                  INGRESOS
                </Text>
                <p className="mt-1 text-sm font-bold text-[var(--premium-success)]">
                  {formatMoney(month.expectedInflows)}
                </p>
              </div>
              <div className="text-right">
                <Text variant="label" className="text-2xs tracking-[0.2em] text-muted-foreground">
                  EGRESOS
                </Text>
                <p className="mt-1 text-sm font-bold text-red-500">
                  {formatMoney(month.expectedOutflows)}
                </p>
              </div>
              <div className="text-right">
                <Text variant="label" className="text-2xs tracking-[0.2em] text-muted-foreground">
                  NETO
                </Text>
                <p className="mt-1 text-sm font-black text-foreground">
                  {formatMoney(month.netCashflow)}
                </p>
                <p className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">
                  Conf. {(month.confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        <Card variant="default" className="border-[var(--border-default)] bg-[var(--surface-1)] p-5">
          <Text variant="label" className="text-label tracking-[0.22em] text-muted-foreground">
            SEÑAL OPERATIVA
          </Text>
          <Text variant="data" className="mt-2 text-2xl">
            {formatMoney(variance.variance.netCashflow)}
          </Text>
          <p className="mt-2 text-xs text-muted-foreground">
            Proyectado {formatMoney(projection.summary.netCashflow)} vs real {formatMoney(actual.netCashflow)}
          </p>
        </Card>

        <Card variant="default" className="border-[var(--border-default)] bg-[var(--surface-1)] p-5">
          <Text variant="label" className="text-label tracking-[0.22em] text-muted-foreground">
            DESVIACIÓN
          </Text>
          <div className="mt-3 grid gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Ingresos</span>
              <span className="font-black text-foreground">
                {formatPercentage(variance.variance.inflowsPercentage)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Egresos</span>
              <span className="font-black text-foreground">
                {formatPercentage(variance.variance.outflowsPercentage)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Neto</span>
              <span className="font-black text-foreground">
                {formatPercentage(variance.variance.netPercentage)}
              </span>
            </div>
          </div>
        </Card>

        <Card variant="default" className="border-[var(--border-default)] bg-[var(--surface-1)] p-5">
          <Text variant="label" className="text-label tracking-[0.22em] text-muted-foreground">
            ALERTAS
          </Text>
          <div className="mt-3 space-y-2">
            {variance.alerts.length > 0 ? (
              variance.alerts.map((alert) => (
                <p
                  key={alert}
                  className="rounded-lg border border-[var(--border-subtle)] bg-black/5 dark:bg-white/5 px-3 py-2 text-xs text-foreground/80"
                >
                  {alert}
                </p>
              ))
            ) : (
              <p className="rounded-lg border border-[var(--border-subtle)] bg-black/5 dark:bg-white/5 px-3 py-2 text-xs text-muted-foreground">
                Sin alertas críticas para el periodo observado.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
