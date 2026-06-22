/**
 * Domain-agnostic ML-based task router.
 *
 * Routes tasks to agents based on:
 * - Task type matching (primary — direct agent type match)
 * - Pattern-based classification (secondary)
 * - DORA metrics for adaptive routing (optional)
 *
 * Zero fiscal-specific patterns — all classification rules are
 * domain-agnostic and can be extended via `addPattern()`.
 *
 * @module @arkelythex/platform-core/swarm
 */

import type { TaskDefinition } from "../kernel/types.js";

/**
 * An agent registered with the router.
 */
export interface RegisteredAgent {
  /** Unique agent identifier */
  id: string;
  /** The agent type this agent handles */
  type: string;
  /** Set of capabilities this agent supports */
  capabilities: string[];
}

/**
 * Performance record for an agent.
 */
interface AgentPerformance {
  totalTasks: number;
  successfulTasks: number;
  totalDuration: number;
  failures: number;
}

/**
 * Configuration options for the TaskRouter.
 */
export interface RouterOptions {
  /** Enable DORA-aware routing using historical performance */
  enableDoraRouting?: boolean;
  /** Minimum confidence threshold for pattern-based classification */
  minConfidence?: number;
}

/**
 * Task router statistics.
 */
export interface RouterStats {
  totalAgents: number;
  totalTasksRouted: number;
}

/**
 * ML-based task router with optional DORA metrics awareness.
 *
 * @example
 * ```ts
 * const router = new TaskRouter({ enableDoraRouting: true });
 * router.registerAgent({ id: "a1", type: "analysis", capabilities: ["code-review"] });
 * const agents = router.route(task);
 * ```
 */
export class TaskRouter {
  private agents = new Map<string, RegisteredAgent>();
  private performance = new Map<string, AgentPerformance>();
  private patterns = new Map<string, RegExp[]>();
  private taskCount = 0;
  private readonly options: Required<RouterOptions>;

  constructor(options: RouterOptions = {}) {
    this.options = {
      enableDoraRouting: options.enableDoraRouting ?? false,
      minConfidence: options.minConfidence ?? 0.3,
    };

    this.initializeDefaultPatterns();
  }

  /**
   * Initialize default domain-agnostic classification patterns.
   */
  private initializeDefaultPatterns(): void {
    this.patterns.set("analysis", [
      /analy(s|z)e?|review|inspect|examine|study/i,
    ]);
    this.patterns.set("compliance", [
      /compliance|audit|regulation|policy|standard|rule/i,
    ]);
    this.patterns.set("security", [
      /security|vulnerability|threat|exploit|xss|injection|auth/i,
    ]);
    this.patterns.set("performance", [
      /performance|optimization|latency|throughput|speed|slow/i,
    ]);
    this.patterns.set("data", [
      /data|analytics|aggregat(e|ion)|report|statistics|insight/i,
    ]);
  }

  /**
   * Register an agent for routing.
   */
  registerAgent(agent: RegisteredAgent): void {
    this.agents.set(agent.id, agent);
    if (!this.performance.has(agent.id)) {
      this.performance.set(agent.id, {
        totalTasks: 0,
        successfulTasks: 0,
        totalDuration: 0,
        failures: 0,
      });
    }
  }

  /**
   * Remove an agent from routing consideration.
   */
  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
    this.performance.delete(agentId);
  }

  /**
   * Record a successful execution result for DORA metrics.
   */
  recordResult(agentId: string, duration: number): void {
    const perf = this.performance.get(agentId);
    if (perf) {
      perf.totalTasks++;
      perf.successfulTasks++;
      perf.totalDuration += duration;
    }
  }

  /**
   * Record a failed execution for DORA metrics.
   */
  recordFailure(agentId: string): void {
    const perf = this.performance.get(agentId);
    if (perf) {
      perf.totalTasks++;
      perf.failures++;
    }
  }

  /**
   * Add a custom pattern for task type classification.
   */
  addPattern(taskType: string, patterns: RegExp[]): void {
    this.patterns.set(taskType, patterns);
  }

  /**
   * Route a task to the best matching agent(s).
   *
   * Returns an array of agent IDs sorted by relevance.
   * Throws if no agents match the task type.
   */
  route(task: TaskDefinition): string[] {
    const candidates = this.findCandidates(task);

    if (candidates.length === 0) {
      throw new Error(
        `No agents registered for task type: ${task.type}`,
      );
    }

    if (this.options.enableDoraRouting) {
      return this.scoreAndSort(candidates);
    }

    return candidates.map((a) => a.id);
  }

  /**
   * Find agents that can handle the task.
   */
  private findCandidates(task: TaskDefinition): RegisteredAgent[] {
    // Primary: direct type match
    const direct = Array.from(this.agents.values()).filter(
      (a) => a.type === task.type,
    );
    if (direct.length > 0) return direct;

    // Secondary: pattern-based classification
    const classifiedType = this.classify(task);
    if (classifiedType) {
      const classified = Array.from(this.agents.values()).filter(
        (a) => a.type === classifiedType,
      );
      if (classified.length > 0) return classified;
    }

    return [];
  }

  /**
   * Classify a task using pattern matching.
   */
  private classify(task: TaskDefinition): string | undefined {
    const content = this.extractContent(task);

    for (const [type, regexes] of this.patterns) {
      let score = 0;
      for (const regex of regexes) {
        if (regex.test(content)) {
          score += 0.5;
        }
      }
      if (score >= this.options.minConfidence) {
        return type;
      }
    }

    return undefined;
  }

  /**
   * Extract searchable content from a task.
   */
  private extractContent(task: TaskDefinition): string {
    const parts: string[] = [task.type, String(task.priority)];
    if (task.input?.query) parts.push(String(task.input.query));
    if (task.input?.description) parts.push(String(task.input.description));
    if (task.metadata) parts.push(JSON.stringify(task.metadata));
    return parts.join(" ").toLowerCase();
  }

  /**
   * Score agents by DORA metrics and return sorted IDs.
   */
  private scoreAndSort(candidates: RegisteredAgent[]): string[] {
    const scored = candidates.map((agent) => {
      const perf = this.performance.get(agent.id);
      let score = 0;

      if (perf && perf.totalTasks > 0) {
        // Success rate (0–50 points)
        const successRate = perf.successfulTasks / perf.totalTasks;
        score += successRate * 50;

        // Speed — lower average duration = higher score (0–30 points)
        const avgDuration = perf.totalDuration / perf.totalTasks;
        const speedScore = Math.max(0, 30 - avgDuration / 100);
        score += speedScore;

        // Reliability — fewer failures = higher score (0–20 points)
        const failureRatio = perf.failures / perf.totalTasks;
        score += (1 - failureRatio) * 20;
      } else {
        // Default score for agents with no history
        score = 50;
      }

      return { id: agent.id, score };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.id);
  }

  /**
   * Return routing statistics.
   */
  getStats(): RouterStats {
    return {
      totalAgents: this.agents.size,
      totalTasksRouted: this.taskCount,
    };
  }
}
