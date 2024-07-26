/**
 * FEOS — Shared Domain Types
 *
 * Framework-free foundational types for the Financial Engineering OS.
 * No external dependencies, no framework imports.
 *
 * @module @drenyra/domain/feos
 */

// ============================================================================
// Branded Identifiers
// ============================================================================

export type WorkspaceId = string & { readonly __brand: "WorkspaceId" };
export type CompanyId = string & { readonly __brand: "CompanyId" };
export type OrganizationId = string & { readonly __brand: "OrganizationId" };
export type PortfolioId = string & { readonly __brand: "PortfolioId" };
export type ChangeSetId = string & { readonly __brand: "ChangeSetId" };
export type EvidenceRootId = string & { readonly __brand: "EvidenceRootId" };
export type ReceiptId = string & { readonly __brand: "ReceiptId" };
export type AttentionId = string & { readonly __brand: "AttentionId" };
export type EventId = string & { readonly __brand: "EventId" };

// ============================================================================
// Fiscal Scope
// ============================================================================

export interface FiscalScope {
  organizationId: OrganizationId;
  companyId: CompanyId;
  companyRuc: string;
  fiscalPeriod: string; // ISO format: "2026-06"
}

// ============================================================================
// References
// ============================================================================

export interface OrganizationRef {
  id: OrganizationId;
  name: string;
  slug: string;
}

export interface PortfolioRef {
  id: PortfolioId;
  name: string;
  organizationId: OrganizationId;
}

export interface CompanyRef {
  id: CompanyId;
  name: string;
  ruc: string;
  organizationId: OrganizationId;
}

export interface PeriodRef {
  year: number;
  month: number; // 1–12
  label: string; // "Junio 2026"
}

// ============================================================================
// Time
// ============================================================================

export interface Timestamp {
  iso: string;          // ISO 8601
  unix: number;         // Unix epoch milliseconds
}

// ============================================================================
// Actors
// ============================================================================

export type ActorType = "user" | "agent" | "system" | "automation";

export interface Actor {
  id: string;
  type: ActorType;
  label: string;
}

// ============================================================================
// Errors
// ============================================================================

export class FeosError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "FeosError";
    this.code = code;
    this.details = details;
  }
}

// ============================================================================
// Helpers
// ============================================================================

let _idCounter = 0;

/**
 * Generate a UUID v4-like string for domain IDs.
 * Uses crypto.randomUUID when available.
 */
export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof (crypto as { randomUUID?: () => string }).randomUUID === "function") {
    return (crypto as { randomUUID: () => string }).randomUUID();
  }
  _idCounter += 1;
  return `id-${Date.now()}-${_idCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Generate ISO 8601 timestamp.
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Generate a Timestamp object for the current time.
 */
export function nowTimestamp(): Timestamp {
  const d = new Date();
  return { iso: d.toISOString(), unix: d.getTime() };
}

const MONTH_LABELS: ReadonlyArray<string> = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/**
 * Create a PeriodRef from year and month with validation.
 */
export function createPeriodRef(year: number, month: number): PeriodRef {
  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    throw new FeosError("INVALID_YEAR", `Year ${year} out of range [2020, 2100]`);
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new FeosError("INVALID_MONTH", `Month ${month} out of range [1, 12]`);
  }
  return { year, month, label: `${MONTH_LABELS[month - 1]} ${year}` };
}
