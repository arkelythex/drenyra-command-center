import { verifyApprovalPairingCode } from './cognitive-approval-pairing';

/**
 * PendingApproval interface.
 *
 * @example
 * ```ts
 * const value: PendingApproval = {} as PendingApproval;
 * console.log(value);
 * ```
 */
export interface PendingApproval {
  runId: string;
  toolCallId: string;
  name: string;
  args: unknown;
  requestedAt: string;
  pairingRequired?: boolean;
  pairingSessionId?: string;
  pairingHint?: string;
  pairingChallenge?: string;
  pairingCodeHash?: string;
}

/**
 * ApprovalResolution type.
 *
 * @example
 * ```ts
 * const value: ApprovalResolution = {} as ApprovalResolution;
 * console.log(value);
 * ```
 */
export type ApprovalResolution = 'approved' | 'rejected' | 'timeout';

/**
 * ApprovalDecision interface.
 *
 * @example
 * ```ts
 * const value: ApprovalDecision = {} as ApprovalDecision;
 * console.log(value);
 * ```
 */
export interface ApprovalDecision {
  approved: boolean;
  resolution: ApprovalResolution;
}

/**
 * ApprovalResolveResult interface.
 *
 * @example
 * ```ts
 * const value: ApprovalResolveResult = {} as ApprovalResolveResult;
 * console.log(value);
 * ```
 */
export interface ApprovalResolveResult {
  ok: boolean;
  code: 'resolved' | 'not_found' | 'pairing_required' | 'pairing_invalid';
}

interface PendingApprovalEntry {
  approval: PendingApproval;
  resolve: (decision: ApprovalDecision) => void;
  timeout: ReturnType<typeof setTimeout>;
}

/**
 * In-memory approval gate for critical tool calls in cognitive streaming.
 * Scoped per API process.
 * @example
 * ```ts
 * const value = new CognitiveApprovalStore();
 * console.log(value);
 * ```
 */

export class CognitiveApprovalStore {
  private pendingByRun = new Map<string, Map<string, PendingApprovalEntry>>();

  async createAndWait(
    approval: PendingApproval,
    timeoutMs: number,
  ): Promise<ApprovalDecision> {
    const runEntries = this.pendingByRun.get(approval.runId) ?? new Map<string, PendingApprovalEntry>();
    this.pendingByRun.set(approval.runId, runEntries);

    if (runEntries.has(approval.toolCallId)) {
      throw new Error(`Approval already pending for toolCallId=${approval.toolCallId}`);
    }

    return new Promise<ApprovalDecision>((resolve) => {
      const timeout = setTimeout(() => {
        runEntries.delete(approval.toolCallId);
        if (runEntries.size === 0) this.pendingByRun.delete(approval.runId);
        resolve({
          approved: false,
          resolution: 'timeout',
        });
      }, timeoutMs);

      runEntries.set(approval.toolCallId, {
        approval,
        timeout,
        resolve: (decision: ApprovalDecision) => {
          clearTimeout(timeout);
          runEntries.delete(approval.toolCallId);
          if (runEntries.size === 0) this.pendingByRun.delete(approval.runId);
          resolve(decision);
        },
      });
    });
  }

  resolve(
    runId: string,
    toolCallId: string,
    approved: boolean,
    options?: { pairingCode?: string },
  ): ApprovalResolveResult {
    const runEntries = this.pendingByRun.get(runId);
    if (!runEntries) {
      return { ok: false, code: 'not_found' };
    }

    const entry = runEntries.get(toolCallId);
    if (!entry) {
      return { ok: false, code: 'not_found' };
    }

    const pairingRequired = entry.approval.pairingRequired === true;
    if (pairingRequired && approved) {
      const pairingCodeHash = entry.approval.pairingCodeHash;
      const pairingSessionId = entry.approval.pairingSessionId;
      if (!options?.pairingCode || !pairingCodeHash || !pairingSessionId) {
        return { ok: false, code: 'pairing_required' };
      }

      const normalizedCode = options.pairingCode.trim();
      if (
        normalizedCode.length === 0 ||
        !verifyApprovalPairingCode(
          normalizedCode,
          {
            codeHash: pairingCodeHash,
            sessionId: pairingSessionId,
          },
          { runId, toolCallId },
        )
      ) {
        return { ok: false, code: 'pairing_invalid' };
      }
    }

    entry.resolve({
      approved,
      resolution: approved ? 'approved' : 'rejected',
    });
    return { ok: true, code: 'resolved' };
  }

  clearRun(runId: string): void {
    const runEntries = this.pendingByRun.get(runId);
    if (!runEntries) return;

    this.pendingByRun.delete(runId);
    for (const entry of runEntries.values()) {
      clearTimeout(entry.timeout);
      entry.resolve({
        approved: false,
        resolution: 'timeout',
      });
    }
  }
}

/**
 * cognitiveApprovalStore const.
 *
 * @example
 * ```ts
 * console.log(cognitiveApprovalStore);
 * ```
 */
export const cognitiveApprovalStore = new CognitiveApprovalStore();
