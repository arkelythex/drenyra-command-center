import { n } from "@/lib/utils";
import type {
  ArtifactInteractionEvent,
  CurrencyCode,
  SireDiffArtifact,
  SireDiffRow,
  SireDocumentRecord,
} from '../../types/artifact.types';
import type { RowDecision, RowDraft, SireSummaryView } from './types';

export function formatCurrency(amount: number, currency: CurrencyCode): string {
  return n(amount, currency);
}

export function statusLabel(status: SireDiffRow['status']): string {
  if (status === 'MATCH') return 'MATCH';
  if (status === 'MISMATCH') return 'MISMATCH';
  if (status === 'MISSING_LOCAL') return 'MISSING_LOCAL';
  return 'MISSING_SUNAT';
}

export function statusClass(status: SireDiffRow['status']): string {
  if (status === 'MATCH') return 'border-[rgba(var(--premium-success-rgb),0.30)] bg-[rgba(var(--premium-success-rgb),0.10)] text-[var(--premium-success)]';
  if (status === 'MISMATCH') return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  return 'border-red-500/30 bg-red-500/10 text-red-300';
}

export function createArtifactEvent(
  artifact: SireDiffArtifact,
  actionId: string,
  message: string,
  nextStatus?: ArtifactInteractionEvent['nextStatus'],
): ArtifactInteractionEvent {
  return {
    id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    artifactId: artifact.id,
    artifactType: artifact.type,
    traceId: artifact.metadata.traceId,
    actionId,
    message,
    nextStatus,
    createdAt: new Date().toISOString(),
  };
}

export function parseAmount(prompt: string): number | null {
  const normalized = prompt.replace(',', '.');
  const match = normalized.match(/\b\d+(?:\.\d{1,2})?\b/);
  if (!match) return null;

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

export function classifyRowStatus(
  localRecord?: SireDocumentRecord,
  sunatRecord?: SireDocumentRecord,
): SireDiffRow['status'] {
  if (localRecord && sunatRecord) {
    const diff = Math.abs(localRecord.total - sunatRecord.total);
    return diff <= 0.01 ? 'MATCH' : 'MISMATCH';
  }
  if (!localRecord && sunatRecord) return 'MISSING_LOCAL';
  if (localRecord && !sunatRecord) return 'MISSING_SUNAT';
  return 'MATCH';
}

export function buildSummary(rows: SireDiffRow[]): SireSummaryView {
  const matched = rows.filter((row) => row.status === 'MATCH').length;
  const mismatched = rows.filter((row) => row.status === 'MISMATCH').length;
  const missingOnLedger = rows.filter((row) => row.status === 'MISSING_LOCAL').length;
  const missingOnSunat = rows.filter((row) => row.status === 'MISSING_SUNAT').length;
  const critical = mismatched + missingOnLedger + missingOnSunat;
  const totalDifference = Number(rows.reduce((acc, row) => acc + row.difference, 0).toFixed(2));

  return {
    matched,
    mismatched,
    missingOnLedger,
    missingOnSunat,
    critical,
    totalDifference,
  };
}

export function buildDraft(row: SireDiffRow, prompt: string): RowDraft | null {
  const normalized = prompt.toLowerCase().trim();
  if (!normalized) {
    return null;
  }

  if (normalized.includes('igual') || normalized.includes('match')) {
    const baseline = row.sunatRecord?.total ?? row.localRecord?.total;
    if (baseline === undefined) return null;

    return {
      localTotal: baseline,
      sunatTotal: baseline,
      note: 'Se igualaron montos entre libro local y SUNAT.',
    };
  }

  const amount = parseAmount(normalized);
  if (amount === null) return null;

  if (normalized.includes('sunat')) {
    return {
      sunatTotal: amount,
      note: `Se sugiere ajustar SUNAT a ${amount.toFixed(2)}.`,
    };
  }

  if (normalized.includes('local')) {
    return {
      localTotal: amount,
      note: `Se sugiere ajustar libro local a ${amount.toFixed(2)}.`,
    };
  }

  return {
    sunatTotal: amount,
    note: `Se sugiere ajustar SUNAT a ${amount.toFixed(2)}.`,
  };
}

export function createInitialDecisions(rows: SireDiffRow[]): Record<string, RowDecision> {
  return Object.fromEntries(
    rows.map((row) => [row.id, row.status === 'MATCH' ? 'KEEP_LOCAL' : 'PENDING']),
  );
}

export function countDecisions(decisions: Record<string, RowDecision>): {
  acceptSunat: number;
  keepLocal: number;
  pending: number;
} {
  const values = Object.values(decisions);

  return {
    acceptSunat: values.filter((value) => value === 'ACCEPT_SUNAT').length,
    keepLocal: values.filter((value) => value === 'KEEP_LOCAL').length,
    pending: values.filter((value) => value === 'PENDING').length,
  };
}

export function applyDecisionInBatch(
  rows: SireDiffRow[],
  decision: Exclude<RowDecision, 'PENDING'>,
): Record<string, RowDecision> {
  return Object.fromEntries(
    rows.map((row) => {
      if (decision === 'ACCEPT_SUNAT' && row.status === 'MATCH') {
        return [row.id, 'KEEP_LOCAL'];
      }
      return [row.id, decision];
    }),
  ) as Record<string, RowDecision>;
}

export function buildSireExportRows(rows: SireDiffRow[]): Array<Array<string | number>> {
  return rows.map((row) => [
    row.status,
    row.localRecord?.series ?? row.sunatRecord?.series ?? '',
    row.localRecord?.number ?? row.sunatRecord?.number ?? '',
    row.localRecord?.issueDate ?? '',
    row.sunatRecord?.issueDate ?? '',
    row.localRecord?.total ?? '',
    row.sunatRecord?.total ?? '',
    row.difference,
    row.reason,
  ]);
}

export function getNextSelectedRowId(
  visibleRows: SireDiffRow[],
  selectedRowId: string | null,
  direction: 'up' | 'down',
): string | null {
  if (visibleRows.length === 0) return null;

  const activeId = selectedRowId ?? visibleRows[0].id;
  const index = visibleRows.findIndex((row) => row.id === activeId);
  const safeIndex = index === -1 ? 0 : index;
  const delta = direction === 'down' ? 1 : -1;
  const nextIndex = (safeIndex + delta + visibleRows.length) % visibleRows.length;

  return visibleRows[nextIndex].id;
}

export function buildSireInlineSuggestions(row: SireDiffRow): string[] {
  const suggestions: string[] = [];

  const sunatTotal = row.sunatRecord?.total;
  const localTotal = row.localRecord?.total;

  if (sunatTotal !== undefined) {
    suggestions.push(`ajusta SUNAT a ${sunatTotal.toFixed(2)}`);
  }

  if (localTotal !== undefined) {
    suggestions.push(`ajusta LOCAL a ${localTotal.toFixed(2)}`);
  }

  if (sunatTotal !== undefined && localTotal !== undefined && Math.abs(sunatTotal - localTotal) > 0.01) {
    suggestions.push('igualar montos');
  }

  suggestions.push('match');

  return [...new Set(suggestions)];
}
