import React from 'react';
import { AlertTriangle, Building2, ChevronRight, ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { n } from '@/lib/utils';

const MOCK_CRITICAL_VENDORS = [
  { id: '1', name: 'CONSTRUCTORA DEL SUR SAC', ruc: '20100000001', status: 'Baja de Oficio', amount: 2100.0 },
  { id: '2', name: 'SERVICIOS GENERALES E.I.R.L.', ruc: '20555555555', status: 'No Habido', amount: 2400.0 },
];

export const VendorHealthWidget: React.FC = () => {
  const totalRisk = MOCK_CRITICAL_VENDORS.reduce((sum, item) => sum + item.amount, 0);

  return (
    <section className="space-y-4" aria-label="Riesgo de proveedores">
      <Card className="rounded-2xl border border-border/70 bg-[var(--surface-1)] p-6 text-foreground shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-label font-semibold uppercase tracking-[0.16em] text-muted-foreground">Vendor risk monitor</p>
            <h3 className="mt-1 text-sm font-semibold tracking-tight">Credito fiscal comprometido</h3>
          </div>
          <ShieldAlert size={18} className="text-destructive" aria-hidden="true" />
        </div>

        <p className="text-3xl font-semibold tabular-nums">{n(totalRisk)}</p>

        <div className="mt-3 flex items-center gap-2 text-xs text-destructive">
          <AlertTriangle size={14} aria-hidden="true" />
          {MOCK_CRITICAL_VENDORS.length} proveedores con riesgo alto
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {MOCK_CRITICAL_VENDORS.map((vendor) => (
          <Card key={vendor.id} className="rounded-2xl border border-border/50 bg-[var(--surface-1)]/84 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/60">
                  <Building2 size={16} className="text-muted-foreground" aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h4 className="truncate text-sm font-medium text-foreground">{vendor.name}</h4>
                    <span className="rounded-md border border-destructive/20 bg-destructive/10 px-1.5 py-0.5 text-2xs font-medium text-destructive">
                      Riesgo
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">RUC {vendor.ruc}</p>
                  <p className="text-xs text-destructive">{vendor.status}</p>

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm font-semibold tabular-nums text-foreground">{n(vendor.amount)}</p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
                    >
                      Historial
                      <ChevronRight size={12} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
