interface ComparisonDatum {
  name: string;
  'Escenario A': number;
  'Escenario B': number;
}

interface LoanComparisonChartProps {
  comparisonData: ComparisonDatum[];
  formatMoney: (value: number) => string;
}

const BAR_WIDTH = 240;

export const LoanComparisonChart = ({
  comparisonData,
  formatMoney,
}: LoanComparisonChartProps) => {
  const maxValue = Math.max(
    ...comparisonData.flatMap((item) => [item['Escenario A'], item['Escenario B']]),
    1,
  );

  return (
    <div className="h-full w-full overflow-auto" role="img" aria-label="Comparativa de impacto entre dos escenarios de crédito">
      <div className="flex h-full min-h-[18rem] flex-col justify-center gap-5">
        {comparisonData.map((item) => {
          const scenarioAWidth = (item['Escenario A'] / maxValue) * BAR_WIDTH;
          const scenarioBWidth = (item['Escenario B'] / maxValue) * BAR_WIDTH;
          const scenarioADominates = item['Escenario A'] <= item['Escenario B'];

          return (
            <section
              key={item.name}
              className="rounded-xl border border-border/45 bg-[var(--surface-2)]/62 px-4 py-4"
              aria-labelledby={`loan-compare-${item.name}`}
            >
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <h4
                  id={`loan-compare-${item.name}`}
                  className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                >
                  {item.name}
                </h4>
                <span className="text-label text-muted-foreground">
                  Diferencia: {formatMoney(Math.abs(item['Escenario A'] - item['Escenario B']))}
                </span>
              </div>

              <div className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-[7rem_minmax(0,1fr)_6.5rem] sm:items-center">
                  <span className="text-xs font-medium text-foreground">Escenario A</span>
                  <div className="h-8 overflow-hidden rounded-md border border-border/35 bg-background/40">
                    <div
                      className="h-full rounded-r-md bg-foreground/88 transition-[width] duration-200"
                      style={{ width: `${Math.max(scenarioAWidth, 6)}px` }}
                    />
                  </div>
                  <span
                    className={`text-right text-xs font-semibold tracking-tight ${scenarioADominates ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                    {formatMoney(item['Escenario A'])}
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-[7rem_minmax(0,1fr)_6.5rem] sm:items-center">
                  <span className="text-xs font-medium text-muted-foreground">Escenario B</span>
                  <div className="h-8 overflow-hidden rounded-md border border-border/35 bg-background/40">
                    <div
                      className="h-full rounded-r-md bg-muted-foreground/45 transition-[width] duration-200"
                      style={{ width: `${Math.max(scenarioBWidth, 6)}px` }}
                    />
                  </div>
                  <span
                    className={`text-right text-xs font-semibold tracking-tight ${!scenarioADominates ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                    {formatMoney(item['Escenario B'])}
                  </span>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
