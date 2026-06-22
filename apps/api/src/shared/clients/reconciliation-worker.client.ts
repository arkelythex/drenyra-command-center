const RECONCILIATION_WORKER_URL =
  process.env.RECONCILIATION_WORKER_URL || 'http://localhost:8120';

export interface ReconciliationWorkerEntry {
  reference: string;
  amountCents: number;
}

export interface ReconciliationWorkerRequest {
  sourceA: ReconciliationWorkerEntry[];
  sourceB: ReconciliationWorkerEntry[];
  toleranceCents?: number;
}

export interface ReconciliationWorkerResult {
  matched: number;
  missingInSourceA: ReconciliationWorkerEntry[];
  missingInSourceB: ReconciliationWorkerEntry[];
  amountMismatches: Array<{
    reference: string;
    left: number;
    right: number;
  }>;
  totalDiscrepancies: number;
}

export class ReconciliationWorkerClient {
  static async healthCheck(): Promise<{ status: string; service?: string }> {
    try {
      const response = await fetch(`${RECONCILIATION_WORKER_URL}/health`);
      if (!response.ok) {
        return { status: 'offline' };
      }
      return await response.json();
    } catch (_error) {
      return { status: 'offline' };
    }
  }

  static async reconcile(
    payload: ReconciliationWorkerRequest
  ): Promise<ReconciliationWorkerResult> {
    const response = await fetch(`${RECONCILIATION_WORKER_URL}/v1/reconcile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sourceA: payload.sourceA,
        sourceB: payload.sourceB,
        toleranceCents: payload.toleranceCents ?? 0,
      }),
    });

    if (!response.ok) {
      throw new Error(`Reconciliation Worker Error: ${response.status}`);
    }

    return await response.json();
  }
}
