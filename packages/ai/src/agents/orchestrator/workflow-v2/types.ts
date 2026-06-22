import type { ExtractedData, ParsedInvoice, ValidationResult, StageLog } from '../../types';

interface AgentMetrics {
  agentName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'running' | 'success' | 'failed' | 'timeout';
  error?: Error;
  retryCount: number;
}

interface ParallelExecutionResult {
  reader: { result: ExtractedData; log: StageLog; metrics: AgentMetrics } | null;
  parser: { result: ParsedInvoice; log: StageLog; metrics: AgentMetrics } | null;
  validator: { result: ValidationResult; log: StageLog; metrics: AgentMetrics } | null;
  errors: Array<{ agent: string; error: Error }>;
  totalDuration: number;
}

interface OrchestratorConfig {
  agentTimeoutMs: number;
  maxRetries: number;
  enableCircuitBreaker: boolean;
  enableMetrics: boolean;
  sessionStore?: import('../../../session/session-store').SessionStore;
  contextMonitor?: import('../../../context-monitor').ContextMonitor;
  pruner?: import('../../../context-monitor').ContextPruner;
  oseService?: {
    sendInvoice: (data: {
      xmlContent: string;
      invoiceNumber: string;
      invoiceType: string;
    }) => Promise<{
      success: boolean;
      cdrContent?: string;
      cdrStatus?: "ACEPTADO" | "RECHAZADO" | "OBSERVADO";
      cdrMessage?: string;
      sunatCode?: string;
      error?: string;
    }>;
  };
}

export type { AgentMetrics, ParallelExecutionResult, OrchestratorConfig };

/**
 * Options for skipping phases during session recovery.
 *
 * When a workflow is recovered from PARSING or later, some agent phases
 * can be skipped by providing their preconstructed output data from
 * the persisted context.
 */
export interface PhaseSkipOptions {
  /** Agent phases to skip. Prebuilt data MUST be provided for skipped phases. */
  skipPhases: Array<'reader' | 'parser' | 'validator'>;

  /** Preconstructed ExtractedData when skipping the reader phase. */
  prebuiltExtractedData?: import('../../types').ExtractedData;

  /** Preconstructed ParsedData when skipping the parser phase. */
  prebuiltParsedData?: import('../../types').ParsedInvoice;

  /** Preconstructed ValidationResult when skipping the validator phase. */
  prebuiltValidationResult?: import('../../types').ValidationResult;
}
