import type { SIRESunatLiveLedgerSummary, SIRESunatLiveUnavailableReason } from '../../../types/sire.types';

export interface SireMassiveAnalysisResult {
  companyId: string;
  status: 'success';
  engine: string;
  [key: string]: unknown;
}

export type SunatLiveLedgerFetchResult =
  | {
    ok: true;
    data: SIRESunatLiveLedgerSummary;
  }
  | {
    ok: false;
    reason: Extract<
      SIRESunatLiveUnavailableReason,
      'auth_unavailable' | 'timeout' | 'upstream_error' | 'invalid_payload' | 'internal_error'
    >;
    error: string;
    retryable: boolean;
    retryAfterMs: number | null;
    attempts: number;
  };
