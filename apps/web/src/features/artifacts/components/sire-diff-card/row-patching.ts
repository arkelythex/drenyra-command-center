import type { SireDiffArtifact, SireDiffRow, SireDocumentRecord } from '../../types/artifact.types';
import type { RowDraft } from './types';
import { classifyRowStatus } from './utils';

export function buildRowFromDraft(row: SireDiffRow, artifact: SireDiffArtifact, draft: RowDraft): SireDiffRow {
  const nextLocalRecord = updateLocalRecord(row, artifact, draft);
  const nextSunatRecord = updateSunatRecord(row, artifact, draft);
  const difference = Number(((nextLocalRecord?.total ?? 0) - (nextSunatRecord?.total ?? 0)).toFixed(2));
  const status = classifyRowStatus(nextLocalRecord, nextSunatRecord);

  return {
    ...row,
    localRecord: nextLocalRecord,
    sunatRecord: nextSunatRecord,
    difference,
    status,
    reason: draft.note,
  };
}

function updateLocalRecord(row: SireDiffRow, artifact: SireDiffArtifact, draft: RowDraft): SireDocumentRecord | undefined {
  if (draft.localTotal === undefined) {
    return row.localRecord;
  }

  return {
    ...(row.localRecord ?? row.sunatRecord ?? buildFallbackRecord(row.id, artifact)),
    total: draft.localTotal,
    currency: artifact.data.currency,
  };
}

function updateSunatRecord(row: SireDiffRow, artifact: SireDiffArtifact, draft: RowDraft): SireDocumentRecord | undefined {
  if (draft.sunatTotal === undefined) {
    return row.sunatRecord;
  }

  return {
    ...(row.sunatRecord ?? row.localRecord ?? buildFallbackRecord(row.id, artifact)),
    total: draft.sunatTotal,
    currency: artifact.data.currency,
  };
}

function buildFallbackRecord(rowId: string, artifact: SireDiffArtifact): SireDocumentRecord {
  return {
    documentType: '01',
    series: 'F001',
    number: rowId,
    issueDate: `${artifact.data.period}-01`,
    currency: artifact.data.currency,
    total: 0,
  };
}
