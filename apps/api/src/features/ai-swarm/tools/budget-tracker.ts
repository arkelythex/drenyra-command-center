/**
 * Budget Tracker
 *
 * Tracks API costs and enforces budget limits.
 * In-memory for POC (can be upgraded to database later).
 *
 * @module ai-swarm/tools
 */

import { BUDGET_LIMITS } from '../config/openrouter.config';
import { aiCostRepository } from '@drenyra/ai/services/ai-cost';

/**
 * Usage record
 */
interface UsageRecord {
  timestamp: Date;
  agentType: string;
  modelUsed: string;
  tokensUsed: number;
  costUsd: number;
  taskId?: string;
}

/**
 * Budget usage
 * @example
 * ```ts
 * const value: BudgetUsage = {} as BudgetUsage;
 * console.log(value);
 * ```
 */

export interface BudgetUsage {
  daily: {
    spent: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  monthly: {
    spent: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  byAgent: Record<
    string,
    {
      calls: number;
      totalCost: number;
      averageCost: number;
    }
  >;
  recentUsage: UsageRecord[];
}

/**
 * Budget Tracker
 *
 * Tracks and enforces budget limits
 * @example
 * ```ts
 * const value = new BudgetTracker();
 * console.log(value);
 * ```
 */

export class BudgetTracker {
  private records: UsageRecord[];
  private limits: typeof BUDGET_LIMITS;

  constructor() {
    this.records = [];
    this.limits = BUDGET_LIMITS;
  }

  /**
   * Record usage — persists to DB (fire-and-forget) + keeps in-memory cache.
   */
  record(record: Omit<UsageRecord, 'timestamp'>): void {
    const entry: UsageRecord = { ...record, timestamp: new Date() };
    this.records.push(entry);

    // Clean old records (keep last 30 days in memory)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    this.records = this.records.filter((r) => r.timestamp >= thirtyDaysAgo);

    // Persist to DB asynchronously — never blocks the AI pipeline
    aiCostRepository
      .record({
        agentType: record.agentType,
        modelUsed: record.modelUsed,
        promptTokens: 0, // UsageRecord only has total — prompt/completion split requires upstream
        completionTokens: record.tokensUsed,
        costUsd: record.costUsd,
        taskId: record.taskId,
      })
      .catch((err) => console.warn('[budget-tracker] DB persist failed:', err));
  }

  /**
   * Get current usage
   */
  getUsage(): BudgetUsage {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Daily usage
    const dailyRecords = this.records.filter((r) => r.timestamp >= oneDayAgo);
    const dailySpent = dailyRecords.reduce((sum, r) => sum + r.costUsd, 0);

    // Monthly usage
    const monthlyRecords = this.records.filter((r) => r.timestamp >= oneMonthAgo);
    const monthlySpent = monthlyRecords.reduce((sum, r) => sum + r.costUsd, 0);

    // By agent
    const byAgent: BudgetUsage['byAgent'] = {};
    for (const record of this.records) {
      if (!byAgent[record.agentType]) {
        byAgent[record.agentType] = {
          calls: 0,
          totalCost: 0,
          averageCost: 0,
        };
      }

      byAgent[record.agentType].calls++;
      byAgent[record.agentType].totalCost += record.costUsd;
    }

    // Calculate averages
    for (const agent of Object.keys(byAgent)) {
      byAgent[agent].averageCost = byAgent[agent].totalCost / byAgent[agent].calls;
    }

    return {
      daily: {
        spent: dailySpent,
        limit: this.limits.daily,
        remaining: Math.max(0, this.limits.daily - dailySpent),
        percentage: (dailySpent / this.limits.daily) * 100,
      },
      monthly: {
        spent: monthlySpent,
        limit: this.limits.monthly,
        remaining: Math.max(0, this.limits.monthly - monthlySpent),
        percentage: (monthlySpent / this.limits.monthly) * 100,
      },
      byAgent,
      recentUsage: this.records.slice(-10), // Last 10 records
    };
  }

  /**
   * Check if budget allows operation
   */
  canAfford(estimatedCost: number): {
    allowed: boolean;
    reason?: string;
  } {
    const usage = this.getUsage();

    // Check daily limit
    if (usage.daily.spent + estimatedCost > this.limits.daily) {
      return {
        allowed: false,
        reason: `Daily budget exceeded. Spent: $${usage.daily.spent.toFixed(4)}, Limit: $${this.limits.daily}`,
      };
    }

    // Check monthly limit
    if (usage.monthly.spent + estimatedCost > this.limits.monthly) {
      return {
        allowed: false,
        reason: `Monthly budget exceeded. Spent: $${usage.monthly.spent.toFixed(4)}, Limit: $${this.limits.monthly}`,
      };
    }

    return { allowed: true };
  }

  /**
   * Get spending trend
   */
  getTrend(days: number = 7): Array<{
    date: string;
    spent: number;
    calls: number;
  }> {
    const trend: Record<string, { spent: number; calls: number }> = {};

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    const relevantRecords = this.records.filter((r) => r.timestamp >= daysAgo);

    for (const record of relevantRecords) {
      const dateKey = record.timestamp.toISOString().split('T')[0];

      if (!trend[dateKey]) {
        trend[dateKey] = { spent: 0, calls: 0 };
      }

      trend[dateKey].spent += record.costUsd;
      trend[dateKey].calls++;
    }

    return Object.entries(trend)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Export records (for persistence)
   */
  export(): UsageRecord[] {
    return [...this.records];
  }

  /**
   * Import records (from persistence)
   */
  import(records: UsageRecord[]): void {
    this.records = records.map((r) => ({
      ...r,
      timestamp: new Date(r.timestamp),
    }));
  }

  /**
   * Clear all records
   */
  clear(): void {
    this.records = [];
  }
}

// Global budget tracker instance
/**
 * budgetTracker const.
 *
 * @example
 * ```ts
 * console.log(budgetTracker);
 * ```
 */
export const budgetTracker = new BudgetTracker();
