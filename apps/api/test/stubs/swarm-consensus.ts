/**
 * Stub for @arkelythex/infrastructure/services/swarm-consensus
 *
 * Prevents Drizzle from connecting to PostgreSQL in test environment.
 * workflow-alert-trigger.ts imports swarmConsensusService transitively.
 *
 * @module test/stubs/swarm-consensus
 */
import { vi } from 'vitest';

export const THRESHOLD_CONFIG = {
  low: { base: 0.60, critical: 0.70 },
  medium: { base: 0.75, critical: 0.85 },
  high: { base: 0.85, critical: 0.92 },
  critical: { base: 0.95, critical: 0.99 },
};

export const swarmConsensusService = {
  calculateConsensus: vi.fn().mockResolvedValue({
    threshold: 0.95,
    dynamicAdjustment: 0,
    consensusScore: 0.60,
    shouldTriggerAlert: false,
    confidenceBreakdown: [],
    reasoning: '[test stub] Consensus not triggered.',
    thresholdReason: '[test stub] Base threshold 95% for severity critical',
  }),
  createAlertFromConsensus: vi.fn().mockResolvedValue(null),
  recordFalsePositive: vi.fn().mockResolvedValue(undefined),
  confirmAlert: vi.fn().mockResolvedValue(undefined),
  resolveAlert: vi.fn().mockResolvedValue(undefined),
  getAlertById: vi.fn().mockResolvedValue(null),
  getAlertsByOrganization: vi.fn().mockResolvedValue([]),
};
