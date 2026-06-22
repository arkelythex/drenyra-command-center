import type { CurrencyCode } from '../../types/artifact.types';
import type { SireSummaryView } from './types';
import { formatCurrency } from './utils';

interface SireDiffSummaryGridProps {
  period: string;
  currency: CurrencyCode;
  summary: SireSummaryView;
}

export function SireDiffSummaryGrid({ period, currency, summary }: SireDiffSummaryGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
      <SummaryCard label="Periodo" value={period} valueClassName="text-foreground" />
      <SummaryCard label="Match" value={summary.matched} valueClassName="text-[var(--premium-success)]" />
      <SummaryCard label="Mismatch" value={summary.mismatched} valueClassName="text-amber-500" />
      <SummaryCard label="Faltante Local" value={summary.missingOnLedger} valueClassName="text-red-500" />
      <SummaryCard label="Faltante SUNAT" value={summary.missingOnSunat} valueClassName="text-red-500" />
      <SummaryCard
        label="Brecha"
        value={formatCurrency(summary.totalDifference, currency)}
        valueClassName="text-amber-600"
      />
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: number | string;
  valueClassName: string;
}

function SummaryCard({ label, value, valueClassName }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-3">
      <p className="text-2xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-black ${valueClassName}`}>{value}</p>
    </div>
  );
}
