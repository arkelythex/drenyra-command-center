/**
 * Stub for @arkelythex/infrastructure/services/ai-cost
 *
 * Prevents Drizzle from connecting to PostgreSQL in test environment.
 * budget-tracker.ts imports aiCostRepository transitively.
 *
 * @module test/stubs/ai-cost
 */
import { vi } from 'vitest';

export const aiCostRepository = {
  record: vi.fn().mockResolvedValue(undefined),
  getSummary: vi.fn().mockResolvedValue({}),
  getRecent: vi.fn().mockResolvedValue([]),
};
