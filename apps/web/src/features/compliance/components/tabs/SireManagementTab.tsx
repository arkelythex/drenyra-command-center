import { useState } from 'react';
import { CloudLightning, Database, ArrowRightLeft, FileDown, SearchCode } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Panel, PanelBody } from '@/components/ui/panel';
import { useHaptics } from '@/hooks/useHaptics';
import { useActiveCompanyContext } from '@/lib/use-active-company-context';
import {
  SIRE_DEMO_EXPORT_PERIOD,
  SIRE_DEMO_EXPORT_PERIOD_LABEL,
  triggerSireDemoExport,
} from '@/features/compliance/lib/sire-demo-export';
import {
  buildSireSummaryPlaceholderCards,
  buildSireSummaryCards,
} from './sire-management/sire-management.constants';
import { formatSireSummaryTimestamp } from './sire-management/sire-summary-timestamp';
import { useSireDemoSummary } from '@/features/compliance/hooks/useSireDemoSummary';
import { SirePreviewTable } from './sire-management/sire-preview-table';
import { SireSummaryCard } from './sire-management/sire-summary-card';
import type { SireSummaryIcon } from './sire-management/sire-management.types';

const getSummaryIcon = (icon: SireSummaryIcon) => {
  switch (icon) {
    case 'sales':
      return <CloudLightning size={20} />;
    case 'purchases':
      return <Database size={20} />;
    case 'differences':
      return <ArrowRightLeft size={20} />;
    default:
      return <CloudLightning size={20} />;
  }
};

const getExportFeedbackLabel = (ledgerType: 'ventas' | 'compras', format: 'TXT' | 'EXCEL') => {
  if (ledgerType === 'ventas' && format === 'TXT') return 'RVIE Ventas TXT';
  if (ledgerType === 'compras' && format === 'EXCEL') return 'RCE Compras Excel';
  return `${ledgerType.toUpperCase()} ${format}`;
};

const getSummaryStatusMessage = (state: { isLoading: boolean; isError: boolean }) => {
  if (state.isLoading) {
    return {
      label: 'Resumen sincronizando',
      description: 'Esperando confirmacion del resumen SIRE demo desde backend.',
      tone: 'info' as const,
    };
  }

  if (state.isError) {
    return {
      label: 'Resumen no disponible',
      description: 'No se pudo obtener el resumen SIRE demo. Se muestra estado sin datos.',
      tone: 'danger' as const,
    };
  }

  return {
    label: 'Resumen verificado',
    description: 'Resumen SIRE confirmado contra el dataset demo del backend.',
    tone: 'success' as const,
  };
};

export const SireManagementTab = () => {
  const { trigger } = useHaptics();
  const {
    companyContext: { companyId },
  } = useActiveCompanyContext();
  const [lastExport, setLastExport] = useState<string | null>(null);
  const {
    data: demoSummaryData,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
  } = useSireDemoSummary();
  const summaryCards = demoSummaryData
    ? buildSireSummaryCards({
        period: demoSummaryData.period,
        sunatCount: demoSummaryData.sales.recordCount,
        systemCount: demoSummaryData.purchases.recordCount,
        differenceCount: demoSummaryData.differences,
        totalAmount: 0,
      })
    : buildSireSummaryPlaceholderCards(isSummaryLoading ? 'loading' : 'error');
  const matchCount: number | string = demoSummaryData
    ? demoSummaryData.matches
    : isSummaryLoading
      ? '...'
      : '—';
  const differenceCount: number | string = demoSummaryData
    ? demoSummaryData.differences
    : isSummaryLoading
      ? '...'
      : '—';
  const tableRows = demoSummaryData?.previewRows ?? [];
  const summaryStatus = getSummaryStatusMessage({
    isLoading: isSummaryLoading,
    isError: isSummaryError,
  });
  const summaryStatusClass =
    summaryStatus.tone === 'danger'
      ? 'border-danger-subtle bg-danger-subtle text-danger'
      : summaryStatus.tone === 'success'
        ? 'border-success-subtle bg-success-subtle text-success'
        : 'border-info-subtle bg-info-subtle text-info';
  const lastVerifiedAt = formatSireSummaryTimestamp(demoSummaryData?.generatedAt);

  const handleExport = (ledgerType: 'ventas' | 'compras', format: 'TXT' | 'EXCEL') => {
    const exportLabel = getExportFeedbackLabel(ledgerType, format);

    trigger('light');
    triggerSireDemoExport({
      companyId,
      ledgerType,
      format,
      period: SIRE_DEMO_EXPORT_PERIOD,
    });
    setLastExport(exportLabel);
    toast.success('Descarga SIRE iniciada', {
      description: `${exportLabel} listo para ${SIRE_DEMO_EXPORT_PERIOD_LABEL}.`,
    });
  };

  return (
    <div className="space-y-6 2xl:space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 2xl:gap-6">
        {summaryCards.map((card) => (
          <SireSummaryCard
            key={card.title}
            icon={getSummaryIcon(card.icon)}
            title={card.title}
            badge={card.badge}
            count={card.count}
            unit={card.unit}
            variant={card.variant}
          />
        ))}
      </div>

      <Panel className="overflow-hidden rounded-2xl border-border/70 bg-card/95">
        <PanelBody className="px-6 pb-4 pt-6 md:px-8 md:pt-7">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-lg border border-border/60 bg-muted/25 p-2 text-info">
                  <SearchCode size={18} />
                </div>
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  Comparativa SIRE vs Libros
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-3 pl-1">
                <span className="text-label font-medium tracking-[0.05em] text-muted-foreground">
                  {SIRE_DEMO_EXPORT_PERIOD_LABEL}
                </span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span className="text-label font-medium tracking-[0.05em] text-info">
                  Cruce completo
                </span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span className="text-label font-medium tracking-[0.05em] text-success">
                  {matchCount} Coincidencias
                </span>
              </div>

              <p className="mt-3 pl-1 text-xs leading-relaxed text-muted-foreground">
                Export demo anclado al dataset seed de {SIRE_DEMO_EXPORT_PERIOD_LABEL} para validación del pitch.
              </p>

              <div className={cn('mt-4 rounded-xl border px-4 py-3', summaryStatusClass)}>
                <p className="text-label font-semibold tracking-[0.05em]">{summaryStatus.label}</p>
                <p className="mt-1 text-xs text-foreground/85">{summaryStatus.description}</p>
                <p className="mt-1 text-label font-medium text-foreground/75">
                  {lastVerifiedAt ? `Ultima verificacion: ${lastVerifiedAt}` : 'Ultima verificacion pendiente'}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-3 md:min-w-[360px] md:items-end">
              <div className="grid w-full gap-3 md:grid-cols-[1fr_auto] md:items-center">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-success-subtle bg-success-subtle p-3 text-center">
                    <p className="text-3xs font-medium tracking-[0.08em] text-success">
                      Coincidencias
                    </p>
                    <p className="text-base font-semibold text-success">{matchCount}</p>
                  </div>
                  <div className="rounded-xl border border-danger-subtle bg-danger-subtle p-3 text-center">
                    <p className="text-3xs font-medium tracking-[0.08em] text-danger">
                      Diferencias
                    </p>
                    <p className="text-base font-semibold text-danger">{differenceCount}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('ventas', 'TXT')}
                    className="h-10 rounded-xl border-border/60 px-4 text-label font-medium tracking-[0.05em] transition-[background-color,border-color] duration-150 hover:bg-muted/35"
                  >
                    <FileDown size={14} className="mr-2 opacity-70" />
                    RVIE TXT
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('compras', 'EXCEL')}
                    className="h-10 rounded-xl border-border/60 px-4 text-label font-medium tracking-[0.05em] transition-[background-color,border-color] duration-150 hover:bg-muted/35"
                  >
                    <FileDown size={14} className="mr-2 opacity-70" />
                    RCE Excel
                  </Button>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => trigger('success')}
                className="h-10 rounded-xl bg-primary px-6 text-label font-semibold tracking-[0.05em] text-primary-foreground shadow-sm transition-[background-color,box-shadow] duration-150 hover:bg-primary/90"
              >
                Aceptar Propuesta
              </Button>

              {lastExport ? (
                <div
                  aria-live="polite"
                  className="rounded-xl border border-info-subtle bg-info-subtle px-4 py-3 text-right"
                >
                  <p className="text-2xs font-semibold tracking-[0.08em] text-info">
                    Descarga iniciada
                  </p>
                  <p className="text-xs text-foreground">
                    {lastExport} listo para {SIRE_DEMO_EXPORT_PERIOD_LABEL}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </PanelBody>

        <SirePreviewTable rows={tableRows} isLoading={isSummaryLoading} hasError={isSummaryError} />
      </Panel>
    </div>
  );
};
