import type { SireDiffArtifact, SireDiffRow } from '../../types/artifact.types';
import type { ArtifactFieldPatch } from '../../types/artifact.types';

export type RowDecision = 'PENDING' | 'ACCEPT_SUNAT' | 'KEEP_LOCAL';

export interface RowDraft {
  localTotal?: number;
  sunatTotal?: number;
  note: string;
  patches?: ArtifactFieldPatch[];
}

export interface SireSummaryView {
  matched: number;
  mismatched: number;
  missingOnLedger: number;
  missingOnSunat: number;
  critical: number;
  totalDifference: number;
}

export type SireStatusFilter = 'ALL' | SireDiffRow['status'];

export interface SireRowActionContext {
  row: SireDiffRow;
  artifact: SireDiffArtifact;
}
