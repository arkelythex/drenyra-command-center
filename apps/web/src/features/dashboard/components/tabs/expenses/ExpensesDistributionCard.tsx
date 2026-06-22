import { Card } from '@/components/ui/card';
import { formatPEN, formatPENCompact, formatPercent } from '@/lib/utils';
import { CATEGORY_BAR_COLORS } from './expenses-tab.constants';

interface ExpenseCategory {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

interface ExpensesDistributionCardProps {
  topCategories: ExpenseCategory[];
  averageCategoryExpense: number;
  topCategory?: ExpenseCategory;
}

const BAR_WIDTH = 320;

export function ExpensesDistributionCard({
  topCategories,
  averageCategoryExpense,
  topCategory,
}: ExpensesDistributionCardProps) {
  if (topCategories.length === 0) {
    return (
      <Card className="rounded-[28px] border border-border/40 bg-white p-6 shadow-sm xl:col-span-7">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Distribución por categoría</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No hay categorías de gasto registradas para este periodo.
          </p>
        </div>
      </Card>
    );
  }

  const maxTotal = Math.max(...topCategories.map((entry) => entry.total), 1);

  return (
    <Card className="rounded-[28px] border border-border/40 bg-white p-6 shadow-sm xl:col-span-7">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Expense mapping</p>
          <h3 className="mt-2 text-sm font-semibold text-foreground">Distribución por categoría</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {topCategory
              ? `${topCategory.category} concentra ${formatPercent(topCategory.percentage)} del gasto del periodo`
              : 'Sin datos para el periodo'}
          </p>
        </div>
        <div className="rounded-full border border-border/50 bg-muted/30 px-3 py-1.5 text-label font-medium text-muted-foreground">
          Top {topCategories.length}
        </div>
      </div>

      <div className="space-y-3" aria-hidden="true">
        {topCategories.map((entry, index) => {
          const width = (entry.total / maxTotal) * BAR_WIDTH;
          const accent = CATEGORY_BAR_COLORS[index] ?? 'hsl(var(--muted-foreground))';

          return (
            <div
              key={entry.category}
              className="rounded-[22px] border border-border/40 bg-muted/10 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
            >
              <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                  <span className="text-sm font-medium text-foreground">{entry.category}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground">{entry.count} comps.</span>
                  <span className="rounded-full border border-border/50 bg-white px-2 py-0.5 font-semibold text-foreground">
                    {formatPercent(entry.percentage)}
                  </span>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem] sm:items-center">
                <div className="h-8 overflow-hidden rounded-xl border border-border/30 bg-muted/20 shadow-inner">
                  <div
                    className="h-full rounded-r-xl transition-[width] duration-200"
                    style={{
                      width: `${Math.max(width, 8)}px`,
                      background: `linear-gradient(90deg, ${accent} 0%, color-mix(in oklab, ${accent} 85%, white) 100%)`,
                    }}
                  />
                </div>
                <span className="text-right text-xs font-semibold tracking-tight tabular-nums text-foreground">
                  {formatPENCompact(entry.total)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[22px] border border-border/40 bg-muted/10 px-4 py-3 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Promedio por categoría</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{formatPEN(averageCategoryExpense)}</p>
        </div>
        <div className="rounded-[22px] border border-border/40 bg-muted/10 px-4 py-3 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Categoría dominante</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{topCategory?.category ?? 'Sin datos'}</p>
        </div>
      </div>
    </Card>
  );
}
