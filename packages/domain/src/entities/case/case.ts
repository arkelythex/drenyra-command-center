/**
 * Case Entity — Multi-domain case with extensible projections.
 *
 * This is the CORE entity that enables cross-domain collaboration.
 * Each vertical (Drenyra, Solevra, Ascleron) attaches its own read-only
 * projection to the case without mutating other domains' data.
 *
 * The Case is the SINGLE SOURCE OF TRUTH. Projections are derived views.
 *
 * Design principles:
 * - Domain-agnostic: NO fiscal, legal, or medical concepts here
 * - Projection-friendly: each domain attaches its own view
 * - Event-sourced: all mutations produce domain events
 * - Ownership-aware: each projection has a clear owner
 */

import { DomainEvent } from '../../events'
import type { Money } from '../../value-objects'

// ─── Core Case Entity ────────────────────────────────────────────────

export type CaseStatus = 'open' | 'active' | 'resolved' | 'closed'

/**
 * CaseIdentity — Branded ID for type safety.
 * Prevents mixing case IDs with other entity IDs.
 */
export type CaseIdentity = string & { readonly __brand: 'CaseId' }

export function CaseId(id: string): CaseIdentity {
  if (!id || id.length === 0) {
    throw new Error('CaseId cannot be empty')
  }
  return id as CaseIdentity
}

/**
 * Case — The core entity for cross-domain collaboration.
 */
export class Case {
  readonly id: CaseIdentity
  readonly companyId: string
  readonly status: CaseStatus
  readonly createdAt: Date
  readonly updatedAt: Date

  // Projections are stored as a Map<DomainKey, Projection>
  // This allows any domain to attach its view without modifying Case
  private readonly projections: Map<string, CaseProjection>

  private constructor(
    id: CaseIdentity,
    companyId: string,
    status: CaseStatus,
    projections: Map<string, CaseProjection>,
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = id
    this.companyId = companyId
    this.status = status
    this.projections = projections
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }

  // ─── Factory ──────────────────────────────────────────────────────

  static create(params: { companyId: string }): Case {
    return new Case(
      CaseId(crypto.randomUUID()),
      params.companyId,
      'open',
      new Map(),
      new Date(),
      new Date()
    )
  }

  // ─── Projections ──────────────────────────────────────────────────

  /**
   * Get a projection by domain key.
   * Returns undefined if the domain hasn't attached a projection yet.
   *
   * @example
   * const fiscal = case.getProjection<FiscalProjection>('fiscal')
   * const legal = case.getProjection<LegalProjection>('legal')
   */
  getProjection<T extends CaseProjection>(domain: DomainKey): T | undefined {
    return this.projections.get(domain) as T | undefined
  }

  /**
   * Attach or update a projection for a specific domain.
   * Only the domain owner can modify its projection.
   *
   * @example
   * const updated = case.attachProjection('fiscal', fiscalProjection, 'fiscal')
   */
  attachProjection(
    domain: DomainKey,
    projection: CaseProjection,
    owner: DomainKey
  ): Case {
    if (domain !== owner) {
      throw new Error(
        `Domain "${domain}" cannot modify projection owned by "${owner}"`
      )
    }

    const newProjections = new Map(this.projections)
    newProjections.set(domain, {
      ...projection,
      domain,
      updatedAt: new Date()
    })

    return new Case(
      this.id,
      this.companyId,
      this.status,
      newProjections,
      this.createdAt,
      new Date()
    )
  }

  /**
   * Get all attached projections.
   * Useful for cross-domain queries (Aevon).
   */
  getAllProjections(): ReadonlyMap<string, CaseProjection> {
    return new Map(this.projections)
  }

  /**
   * Check which domains have projections on this case.
   */
  getAttachedDomains(): DomainKey[] {
    return Array.from(this.projections.keys()) as DomainKey[]
  }

  // ─── Status Transitions ───────────────────────────────────────────

  activate(): Case {
    if (this.status !== 'open') {
      throw new Error(`Cannot activate case in status "${this.status}"`)
    }
    return new Case(
      this.id,
      this.companyId,
      'active',
      this.projections,
      this.createdAt,
      new Date()
    )
  }

  resolve(): Case {
    if (this.status !== 'active') {
      throw new Error(`Cannot resolve case in status "${this.status}"`)
    }
    return new Case(
      this.id,
      this.companyId,
      'resolved',
      this.projections,
      this.createdAt,
      new Date()
    )
  }

  close(): Case {
    if (this.status !== 'resolved') {
      throw new Error(`Cannot close case in status "${this.status}"`)
    }
    return new Case(
      this.id,
      this.companyId,
      'closed',
      this.projections,
      this.createdAt,
      new Date()
    )
  }

  // ─── Domain Events ────────────────────────────────────────────────

  /**
   * Emit events when projections are attached.
   * These events enable cross-domain coordination.
   */
  static projectionAttached(
    caseId: CaseIdentity,
    domain: DomainKey
  ): CaseProjectionAttached {
    return new CaseProjectionAttached(caseId, domain)
  }
}

// ─── Projection System ───────────────────────────────────────────────

/**
 * DomainKey — Typed string for domain identifiers.
 * Prevents typos and enables autocomplete.
 */
export type DomainKey =
  | 'fiscal'       // Drenyra
  | 'legal'        // Solevra
  | 'clinical'     // Ascleron
  | 'creative'     // Aurevon
  | 'operational'  // Arkoven
  | 'financial'    // Aetheron
  | 'technical'    // Ferion
  | 'government'   // Valion
  | string         // Future domains

/**
 * CaseProjection — Base interface for all domain projections.
 *
 * Every projection MUST:
 * - Identify its domain (for ownership checks)
 * - Track when it was last updated
 * - Be immutable (methods return new instances)
 */
export interface CaseProjection {
  readonly domain: DomainKey
  readonly updatedAt: Date
  readonly metadata: ProjectionMetadata
}

/**
 * ProjectionMetadata — Shared metadata across all projections.
 * Enables cross-domain queries without knowing projection-specific fields.
 */
export interface ProjectionMetadata {
  readonly summary: string          // Human-readable one-liner
  readonly priority: 'low' | 'medium' | 'high' | 'critical'
  readonly assignedTo?: string      // Agent or human responsible
  readonly dueDate?: Date           // Deadline if applicable
  readonly tags: readonly string[]  // For filtering and grouping
}

// ─── Cross-Domain Events ─────────────────────────────────────────────

/**
 * CaseProjectionAttached — Emitted when a domain attaches a projection.
 * Aevon uses this to coordinate cross-domain workflows.
 */
export class CaseProjectionAttached extends DomainEvent {
  get eventName(): string {
    return 'case.projection.attached'
  }

  constructor(
    readonly caseId: CaseIdentity,
    readonly domain: DomainKey
  ) {
    super()
  }

  protected getPayload(): Record<string, unknown> {
    return {
      caseId: this.caseId,
      domain: this.domain,
    }
  }
}

/**
 * CaseProjectionUpdated — Emitted when a projection is modified.
 * Enables reactive workflows (e.g., fiscal change triggers legal review).
 */
export class CaseProjectionUpdated extends DomainEvent {
  get eventName(): string {
    return 'case.projection.updated'
  }

  constructor(
    readonly caseId: CaseIdentity,
    readonly domain: DomainKey,
    readonly changedFields: readonly string[]
  ) {
    super()
  }

  protected getPayload(): Record<string, unknown> {
    return {
      caseId: this.caseId,
      domain: this.domain,
      changedFields: this.changedFields,
    }
  }
}

/**
 * CaseCrossDomainQuery — Request for data from another domain.
 * The queried domain can choose to respond or deny.
 */
export class CaseCrossDomainQuery extends DomainEvent {
  get eventName(): string {
    return 'case.cross_domain.query'
  }

  constructor(
    readonly caseId: CaseIdentity,
    readonly sourceDomain: DomainKey,
    readonly targetDomain: DomainKey,
    readonly queryType: string,
    readonly queryPayload: Record<string, unknown>
  ) {
    super()
  }

  protected getPayload(): Record<string, unknown> {
    return {
      caseId: this.caseId,
      sourceDomain: this.sourceDomain,
      targetDomain: this.targetDomain,
      queryType: this.queryType,
      payload: this.queryPayload,
    }
  }
}

// ─── Domain-Specific Projection Examples ─────────────────────────────

/**
 * FiscalProjection — Drenyra's view of a case.
 * ONLY Drenyra should create/update this.
 */
export interface FiscalProjection extends CaseProjection {
  readonly domain: 'fiscal'
  readonly ruc: string
  readonly period: string                    // "2026-01"
  readonly totalIncome: Money
  readonly totalTax: Money
  readonly status: 'pending' | 'filed' | 'audited'
  readonly sunatSubmissionId?: string
}

/**
 * LegalProjection — Solevra's view of a case.
 * ONLY Solevra should create/update this.
 */
export interface LegalProjection extends CaseProjection {
  readonly domain: 'legal'
  readonly matterType: string                // "contract_dispute", "regulatory"
  readonly clientId: string
  readonly opposingParty?: string
  readonly deadlines: readonly Date[]
  readonly status: 'research' | 'active_litigation' | 'settled'
}

/**
 * ClinicalProjection — Ascleron's view of a case.
 * ONLY Ascleron should create/update this.
 */
export interface ClinicalProjection extends CaseProjection {
  readonly domain: 'clinical'
  readonly patientId: string
  readonly diagnosisCode: string            // ICD-10
  readonly treatmentPlan: string
  readonly status: 'diagnosis' | 'treatment' | 'follow_up'
}

// ─── Repository Interface ────────────────────────────────────────────

/**
 * CaseRepository — Interface for case persistence.
 * Implementation belongs in infrastructure layer.
 */
export interface CaseRepository {
  findById(id: CaseIdentity): Promise<Case | null>
  findByCompany(companyId: string): Promise<Case[]>
  findByDomain(domain: DomainKey): Promise<Case[]>
  findByStatus(status: CaseStatus): Promise<Case[]>
  save(caseEntity: Case): Promise<void>
  delete(id: CaseIdentity): Promise<void>
}

// ─── Cross-Domain Query Protocol ─────────────────────────────────────

/**
 * CrossDomainQuery — Protocol for querying data across domains.
 *
 * Flow:
 * 1. Domain A sends query to Domain B
 * 2. Domain B receives query, decides whether to respond
 * 3. Domain B responds with projection data (or denies)
 * 4. Aevon orchestrates the exchange
 */
export interface CrossDomainQuery<TRequest, TResponse> {
  readonly sourceDomain: DomainKey
  readonly targetDomain: DomainKey
  readonly queryType: string

  /**
   * Validate the request before sending.
   */
  validateRequest(request: TRequest): boolean

  /**
   * Process the query and return a response.
   * The target domain decides what data to share.
   */
  processQuery(
    request: TRequest,
    caseEntity: Case
  ): Promise<CrossDomainResponse<TResponse>>
}

/**
 * CrossDomainResponse — Response from a domain query.
 */
export type CrossDomainResponse<T> =
  | { success: true; data: T }
  | { success: false; reason: string }  // Domain denied the query
