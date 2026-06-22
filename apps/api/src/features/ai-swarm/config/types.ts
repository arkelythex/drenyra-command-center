/**
 * Shared types for Agent Swarm
 *
 * @module ai-swarm/types
 * Agent types in the swarm
 * @example
 * ```ts
 * const value: AgentType = {} as AgentType;
 * console.log(value);
 * ```
 */

export type AgentType =
  | 'orchestrator'
  | 'ocr'
  | 'sunat'
  | 'pcge'
  | 'reconciliation'
  | 'evidence';

/**
 * Task priority levels
 * @example
 * ```ts
 * const value: TaskPriority = {} as TaskPriority;
 * console.log(value);
 * ```
 */

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Task status
 * @example
 * ```ts
 * const value: TaskStatus = {} as TaskStatus;
 * console.log(value);
 * ```
 */

export type TaskStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Base task interface
 * @example
 * ```ts
 * const value: BaseTask = {} as BaseTask;
 * console.log(value);
 * ```
 */

export interface BaseTask {
  id: string;
  type: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Task analysis result from orchestrator
 * @example
 * ```ts
 * const value: TaskAnalysis = {} as TaskAnalysis;
 * console.log(value);
 * ```
 */

export interface TaskAnalysis {
  shouldParallelize: boolean;
  batchSize: number;
  estimatedCost: number;
  estimatedTime: number; // seconds
  agentsRequired: AgentType[];
}

/**
 * Agent execution result
 * @example
 * ```ts
 * const value: AgentResult = {} as AgentResult;
 * console.log(value);
 * ```
 * @typeParam T - Generic type parameter for AgentResult.
 */

export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata: {
    agentType: AgentType;
    modelUsed: string;
    tokensUsed: number;
    costUsd: number;
    durationMs: number;
    timestamp: Date;
  };
}

/**
 * Validation result structure
 * @example
 * ```ts
 * const value: ValidationResult = {} as ValidationResult;
 * console.log(value);
 * ```
 */

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  confidence: number; // 0-1
}

/**
 * ValidationError interface.
 *
 * @example
 * ```ts
 * const value: ValidationError = {} as ValidationError;
 * console.log(value);
 * ```
 */
export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'critical';
}

/**
 * ValidationWarning interface.
 *
 * @example
 * ```ts
 * const value: ValidationWarning = {} as ValidationWarning;
 * console.log(value);
 * ```
 */
export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  suggestion?: string;
}

/**
 * Invoice data structure (simplified for POC)
 * @example
 * ```ts
 * const value: InvoiceData = {} as InvoiceData;
 * console.log(value);
 * ```
 */

export interface InvoiceData {
  id: string;
  ruc: string;
  serie: string;
  numero: string;
  fecha: string;
  moneda: import('@arkelythex/domain').Currency;
  subtotal: number;
  igv: number;
  total: number;
  items: InvoiceItem[];
}

/**
 * InvoiceItem interface.
 *
 * @example
 * ```ts
 * const value: InvoiceItem = {} as InvoiceItem;
 * console.log(value);
 * ```
 */
export interface InvoiceItem {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

/**
 * PCGE classification result
 * @example
 * ```ts
 * const value: PCGEClassification = {} as PCGEClassification;
 * console.log(value);
 * ```
 */

export interface PCGEClassification {
  cuenta: string;
  descripcion: string;
  debe: number;
  haber: number;
  confidence: number;
  evidence?: string;
}
