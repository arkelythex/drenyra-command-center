'use client';

import { Card } from '@/components/ui/card';
import { Text } from '@/components/atoms/text';

interface CashflowMetricsGridProps {
  actualNetCashflow: number;
  actualInflows: number;
  actualOutflows: number;
  projectedNet: number;
  incomePending: number;
  expensePending: number;
  varianceNet: number;
  netPercentage: number;
  nextForecastNet: number;
  basedOnMonths: number;
  formatMoney: (amount: number) => string;
  formatPercentage: (value: number) => string;
}

export function CashflowMetricsGrid({
  actualNetCashflow,
  actualInflows,
  actualOutflows,
  projectedNet,
  incomePending,
  expensePending,
  varianceNet,
  netPercentage,
  nextForecastNet,
  basedOnMonths,
  formatMoney,
  formatPercentage,
}: CashflowMetricsGridProps): JSX.Element {
  return (
    <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card variant="default" className="border-[var(--border-default)] bg-[var(--surface-1)] p-5">
        <Text variant="label" className="text-label tracking-[0.22em] text-muted-foreground">
          REAL 30D
        </Text>
        <Text variant="data" className="mt-2 text-2xl text-foreground">
          {formatMoney(actualNetCashflow)}
        </Text>
        <p className="mt-2 text-xs text-muted-foreground">
          Ingresos {formatMoney(actualInflows)} · Egresos {formatMoney(actualOutflows)}
        </p>
      </Card>
      <Card variant="default" className="border-[var(--border-default)] bg-[var(--surface-1)] p-5">
        <Text variant="label" className="text-label tracking-[0.22em] text-muted-foreground">
          PROYECTADO 30D
        </Text>
        <Text variant="data" className="mt-2 text-2xl text-foreground">
          {formatMoney(projectedNet)}
        </Text>
        <p className="mt-2 text-xs text-muted-foreground">
          Por cobrar {formatMoney(incomePending)} · Por pagar {formatMoney(expensePending)}
        </p>
      </Card>
      <Card variant="default" className="border-[var(--border-default)] bg-[var(--surface-1)] p-5">
        <Text variant="label" className="text-label tracking-[0.22em] text-muted-foreground">
          VARIACIÓN
        </Text>
        <Text variant="data" className="mt-2 text-2xl text-foreground">
          {formatMoney(varianceNet)}
        </Text>
        <p className="mt-2 text-xs text-muted-foreground">Neto {formatPercentage(netPercentage)}</p>
      </Card>
      <Card variant="default" className="border-[var(--border-default)] bg-[var(--surface-1)] p-5">
        <Text variant="label" className="text-label tracking-[0.22em] text-muted-foreground">
          PRÓXIMO MES
        </Text>
        <Text variant="data" className="mt-2 text-2xl text-foreground">
          {formatMoney(nextForecastNet)}
        </Text>
        <p className="mt-2 text-xs text-muted-foreground">Forecast basado en {basedOnMonths} meses</p>
      </Card>
    </div>
  );
}
