/**
 * Inter-Company Transaction — Domain Entity Types
 *
 * Pure TypeScript types for the inter-company bounded context.
 * No infrastructure dependencies allowed in this layer.
 */

import type { SpotDetractionProfile } from '../../taxation/domain/spot-detraction-profile';

// ─── Primitives ───────────────────────────────────────────────────────────────

/**
 * TaxType type.
 *
 * @example
 * ```ts
 * const value: TaxType = {} as TaxType;
 * console.log(value);
 * ```
 */
export type TaxType = 'GRAVADO' | 'EXONERADO' | 'INAFECTO';

// ─── Value Objects ────────────────────────────────────────────────────────────

/**
 * TaxCalculations interface.
 *
 * @example
 * ```ts
 * const value: TaxCalculations = {} as TaxCalculations;
 * console.log(value);
 * ```
 */
export interface TaxCalculations {
  subtotal: number;
  igv: number;
  total: number;
  hasDetraction: boolean;
  detraction: number | null;
  detractionRate: number | null;
  detractionProfile: SpotDetractionProfile | null;
  detractionRuleCode: string | null;
}

// ─── Entities ─────────────────────────────────────────────────────────────────

/**
 * InterCompanyTransactionRow interface.
 *
 * @example
 * ```ts
 * const value: InterCompanyTransactionRow = {} as InterCompanyTransactionRow;
 * console.log(value);
 * ```
 */
export interface InterCompanyTransactionRow {
  id: string;
  economicGroupId: string;
  fromCompanyId: string;
  fromTransactionId: string | null;
  toCompanyId: string;
  toTransactionId: string | null;
  concept: string;
  amount: string;
  taxType: string;
  igvAmount: string | null;
  detractionAmount: string | null;
  detractionRate: string | null;
  detractionProfile: SpotDetractionProfile | null;
  detractionRuleCode: string | null;
  status: string;
  reconciledAt: Date | null;
  spotPdfUrl: string | null;
  spotReferenceNumber: string | null;
  createdAt: Date;
}

/**
 * InterCompanyTransactionEnriched interface.
 *
 * @example
 * ```ts
 * const value: InterCompanyTransactionEnriched = {} as InterCompanyTransactionEnriched;
 * console.log(value);
 * ```
 */
export interface InterCompanyTransactionEnriched extends InterCompanyTransactionRow {
  fromCompanyName: string;
  fromCompanyRuc: string;
  toCompanyName: string;
  toCompanyRuc: string;
}

// ─── Commands ─────────────────────────────────────────────────────────────────

/**
 * CreateInterCompanyTransactionInput interface.
 *
 * @example
 * ```ts
 * const value: CreateInterCompanyTransactionInput = {} as CreateInterCompanyTransactionInput;
 * console.log(value);
 * ```
 */
export interface CreateInterCompanyTransactionInput {
  economicGroupId: string;
  fromCompanyId: string;
  toCompanyId: string;
  concept: string;
  amount: number;
  taxType: TaxType;
  detractionProfile?: SpotDetractionProfile;
}

/**
 * AtomicCreateInput interface.
 *
 * @example
 * ```ts
 * const value: AtomicCreateInput = {} as AtomicCreateInput;
 * console.log(value);
 * ```
 */
export interface AtomicCreateInput {
  economicGroupId: string;
  fromCompanyId: string;
  toCompanyId: string;
  concept: string;
  amount: number;
  taxType: TaxType;
  calculations: TaxCalculations;
  detractionProfile: SpotDetractionProfile | null;
}

/**
 * CreateInterCompanyTransactionResult interface.
 *
 * @example
 * ```ts
 * const value: CreateInterCompanyTransactionResult = {} as CreateInterCompanyTransactionResult;
 * console.log(value);
 * ```
 */
export interface CreateInterCompanyTransactionResult {
  interCompany: { id: string };
  expense: { id: string };
  income: { id: string };
  calculations: TaxCalculations;
}

/**
 * SpotPdfResult interface.
 *
 * @example
 * ```ts
 * const value: SpotPdfResult = {} as SpotPdfResult;
 * console.log(value);
 * ```
 */
export interface SpotPdfResult {
  url: string;
  referenceNumber: string;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * InterCompanyDetractionAuditFilters interface.
 *
 * @example
 * ```ts
 * const value: InterCompanyDetractionAuditFilters = {} as InterCompanyDetractionAuditFilters;
 * console.log(value);
 * ```
 */
export interface InterCompanyDetractionAuditFilters {
  economicGroupId: string;
  detractionProfile?: SpotDetractionProfile;
  detractionRuleCode?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'amount' | 'igvAmount' | 'detractionAmount';
  sortDir?: 'asc' | 'desc';
}

/**
 * AuditPage interface.
 *
 * @example
 * ```ts
 * const value: AuditPage = {} as AuditPage;
 * console.log(value);
 * ```
 */
export interface AuditPage {
  items: InterCompanyTransactionEnriched[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
