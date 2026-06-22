import { describe, expect, it } from 'vitest';
import { formatDashboardFreshness } from '../dashboard-freshness';

describe('formatDashboardFreshness', () => {
  it('returns a stable fallback label for empty timestamps', () => {
    expect(formatDashboardFreshness(0)).toBe('Sin sincronización reciente');
  });

  it('formats a valid timestamp for es-PE locale', () => {
    expect(formatDashboardFreshness(Date.UTC(2026, 2, 3, 15, 45))).toContain('03/03/2026');
  });
});
