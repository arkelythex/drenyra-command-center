import { logger } from '../../lib/logger';

/**
 * Canonical result values for security access logging.
 *
 * @example
 * ```ts
 * const result: SecurityAccessResult = 'ALLOW';
 * ```
 */
export type SecurityAccessResult = 'ALLOW' | 'DENY' | 'FAILED';

/**
 * Structured security access event captured for audit and operational review.
 *
 * @example
 * ```ts
 * const event: SecurityAccessEvent = {
 *   action: 'audit:trail:read',
 *   resource: 'audit-log',
 *   result: 'ALLOW',
 * };
 * ```
 */
export interface SecurityAccessEvent {
  action: string;
  resource: string;
  result: SecurityAccessResult;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

const MAX_RECENT_EVENTS = 500;
const recentSecurityEvents: SecurityAccessEvent[] = [];

function shouldSkipStructuredLogging(): boolean {
  const isTest = (process.env.NODE_ENV ?? '').toLowerCase() === 'test';
  if (!isTest) return false;

  const enforce = (process.env.SECURITY_ENFORCE_TEST_ACCESS_LOGS ?? '').toLowerCase();
  return !(enforce === '1' || enforce === 'true');
}

/**
 * Persists a security access event in the in-memory recent buffer and structured logs.
 *
 * @param event - Security event to normalize and record.
 * @returns A promise that resolves when the event has been buffered and optionally logged.
 * @example
 * ```ts
 * await logSecurityAccess({
 *   action: 'audit:trail:read',
 *   resource: 'audit-log',
 *   result: 'ALLOW',
 * });
 * ```
 */
export async function logSecurityAccess(event: SecurityAccessEvent): Promise<void> {
  const normalized: SecurityAccessEvent = {
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString(),
  };

  recentSecurityEvents.push(normalized);
  if (recentSecurityEvents.length > MAX_RECENT_EVENTS) {
    recentSecurityEvents.shift();
  }

  if (shouldSkipStructuredLogging()) return;

  const level = normalized.result === 'ALLOW' ? 'info' : 'warn';
  logger[level]({ security: normalized }, 'Security access event');
}

/**
 * Returns the most recent security access events up to the requested limit.
 *
 * @param limit - Maximum number of recent events to return.
 * @returns A slice of recent events ordered from oldest to newest within the selected window.
 * @example
 * ```ts
 * const events = getRecentSecurityAccessEvents(10);
 * console.log(events.length);
 * ```
 */
export function getRecentSecurityAccessEvents(limit = 50): SecurityAccessEvent[] {
  const boundedLimit = Math.max(1, Math.min(limit, MAX_RECENT_EVENTS));
  return recentSecurityEvents.slice(-boundedLimit);
}

/**
 * Clears the in-memory cache of recent security events.
 *
 * @returns Nothing.
 * @example
 * ```ts
 * clearSecurityAccessEvents();
 * ```
 */
export function clearSecurityAccessEvents(): void {
  recentSecurityEvents.splice(0, recentSecurityEvents.length);
}
