import { db } from '@arkelythex/persistence/client';

/**
 * ArtifactEventAuditQuery interface.
 *
 * @example
 * ```ts
 * const value: ArtifactEventAuditQuery = {} as ArtifactEventAuditQuery;
 * console.log(value);
 * ```
 */
export interface ArtifactEventAuditQuery {
  companyId: string;
  traceId?: string;
  artifactType?: string;
  actionId?: string;
  limit?: number;
  offset?: number;
}

/**
 * ArtifactEventAuditRecord interface.
 *
 * @example
 * ```ts
 * const value: ArtifactEventAuditRecord = {} as ArtifactEventAuditRecord;
 * console.log(value);
 * ```
 */
export interface ArtifactEventAuditRecord {
  id: string;
  actorUserId: string | null;
  companyId: string;
  artifactId: string;
  artifactType: string;
  traceId: string;
  actionId: string;
  message: string;
  nextStatus?: string;
  createdAt: string;
  source: string;
  payload?: Record<string, unknown>;
}

/**
 * ArtifactEventAuditResult interface.
 *
 * @example
 * ```ts
 * const value: ArtifactEventAuditResult = {} as ArtifactEventAuditResult;
 * console.log(value);
 * ```
 */
export interface ArtifactEventAuditResult {
  items: ArtifactEventAuditRecord[];
  total: number;
  limit: number;
  offset: number;
}

interface RawArtifactEventPayload {
  type: string;
  source: string;
  companyId: string;
  actionId?: string;
  createdAt?: string;
  artifactId: string;
  artifactType: string;
  traceId: string;
  message: string;
  nextStatus?: string;
  payload?: Record<string, unknown>;
}

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const EXTRA_SCAN_BUFFER = 120;
const MAX_SCAN_LIMIT = 1000;

/**
 * ArtifactEventQueryService class.
 *
 * @example
 * ```ts
 * const value = new ArtifactEventQueryService();
 * console.log(value);
 * ```
 */
export class ArtifactEventQueryService {
  static async list(query: ArtifactEventAuditQuery): Promise<ArtifactEventAuditResult> {
    const limit = clampLimit(query.limit);
    const offset = clampOffset(query.offset);
    const scanLimit = Math.min(limit + offset + EXTRA_SCAN_BUFFER, MAX_SCAN_LIMIT);

    const rows = await db.query.authAuditLogs.findMany({
      columns: {
        id: true,
        userId: true,
        timestamp: true,
        details: true,
      },
      orderBy: (table, { desc }) => desc(table.timestamp),
      limit: scanLimit,
    });

    const items = rows
      .map((row) => mapRow(row.id, row.userId, row.timestamp, row.details))
      .filter((item): item is ArtifactEventAuditRecord => item !== null)
      .filter((item) => itemMatchesFilters(item, query));

    return {
      items: items.slice(offset, offset + limit),
      total: items.length,
      limit,
      offset,
    };
  }
}

function itemMatchesFilters(item: ArtifactEventAuditRecord, query: ArtifactEventAuditQuery): boolean {
  if (item.companyId !== query.companyId) return false;
  if (query.traceId && item.traceId !== query.traceId) return false;
  if (query.artifactType && item.artifactType !== query.artifactType) return false;
  if (query.actionId && item.actionId !== query.actionId) return false;
  return true;
}

function mapRow(
  id: string,
  actorUserId: string | null,
  timestamp: Date,
  details: unknown,
): ArtifactEventAuditRecord | null {
  const payload = asRawPayload(details);
  if (!payload || payload.type !== 'ARTIFACT_EVENT') return null;
  if (!payload.companyId || !payload.artifactId || !payload.artifactType || !payload.traceId || !payload.message) {
    return null;
  }

  return {
    id,
    actorUserId,
    companyId: payload.companyId,
    artifactId: payload.artifactId,
    artifactType: payload.artifactType,
    traceId: payload.traceId,
    actionId: payload.actionId?.trim() || 'artifact-event',
    message: payload.message,
    nextStatus: payload.nextStatus,
    createdAt: payload.createdAt?.trim() || timestamp.toISOString(),
    source: payload.source,
    payload: payload.payload,
  };
}

function asRawPayload(value: unknown): RawArtifactEventPayload | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as RawArtifactEventPayload;
}

function clampLimit(value?: number): number {
  if (!Number.isFinite(value) || !value || value <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.trunc(value), MAX_LIMIT);
}

function clampOffset(value?: number): number {
  if (!Number.isFinite(value) || value === undefined || value < 0) return 0;
  return Math.trunc(value);
}
