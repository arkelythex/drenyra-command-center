import { Card } from '@/components/ui/card';
import { formatPEN, formatPercent } from '@/lib/utils';

interface TopVendor {
  vendorId: string;
  vendorName: string;
  ruc: string;
  total: number;
  billCount: number;
}

interface ExpensesTopVendorsCardProps {
  topVendors: TopVendor[];
  totalExpenses: number;
}

export function ExpensesTopVendorsCard({ topVendors, totalExpenses }: ExpensesTopVendorsCardProps) {
  const maxVendorTotal = Math.max(...topVendors.map((vendor) => vendor.total), 1);

  return (
    <Card className="rounded-2xl border border-border/40 bg-white p-6 shadow-sm xl:col-span-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Proveedores principales</h3>
        <p className="text-xs text-muted-foreground">Por monto total</p>
      </div>

      <div className="space-y-3">
        {topVendors.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            No hay proveedores registrados para este periodo.
          </p>
        ) : (
          topVendors.map((vendor, index) => {
            const share = totalExpenses > 0 ? (vendor.total / totalExpenses) * 100 : 0;
            const relativeWidth = Math.max(8, (vendor.total / maxVendorTotal) * 100);

            return (
              <div
                key={vendor.vendorId}
                className="rounded-xl border border-border/30 bg-muted/10 p-4 transition-colors hover:bg-muted/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{vendor.vendorName}</p>
                    <p className="text-xs text-muted-foreground">RUC {vendor.ruc || '---'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{formatPEN(vendor.total)}</p>
                    <p className="text-xs text-muted-foreground">{vendor.billCount} docs</p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Participación</span>
                    <span>{formatPercent(share)}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted/40">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${relativeWidth}%`,
                        backgroundColor: index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
