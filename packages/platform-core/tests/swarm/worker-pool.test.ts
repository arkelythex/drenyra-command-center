import { describe, it, expect } from "vitest";
import { WorkerPool } from "../../src/swarm/worker-pool.js";

describe("WorkerPool", () => {
  describe("initialization", () => {
    it("creates a worker pool with the specified max workers", () => {
      const pool = new WorkerPool({ maxWorkers: 4 });
      expect(pool.getMetrics().maxWorkers).toBe(4);
      expect(pool.getMetrics().activeWorkers).toBe(0);
      expect(pool.getMetrics().queuedTasks).toBe(0);
    });

    it("uses default max workers when not specified", () => {
      const pool = new WorkerPool();
      expect(pool.getMetrics().maxWorkers).toBeGreaterThan(0);
    });
  });

  describe("task execution", () => {
    it("executes a task and returns the result", async () => {
      const pool = new WorkerPool({ maxWorkers: 2 });

      const result = await pool.execute(
        { id: "task-1", type: "analysis", priority: "high", input: {} },
        async () => ({ success: true, data: "done" }),
      );

      expect(result).toEqual({ success: true, data: "done" });
    });

    it("tracks execution metrics", async () => {
      const pool = new WorkerPool({ maxWorkers: 2 });

      await pool.execute(
        { id: "task-1", type: "analysis", priority: "high", input: {} },
        async () => ({ success: true, data: "ok" }),
      );

      const metrics = pool.getMetrics();
      expect(metrics.tasksExecuted).toBe(1);
      expect(metrics.tasksFailed).toBe(0);
    });

    it("handles task execution failure gracefully", async () => {
      const pool = new WorkerPool({ maxWorkers: 2 });

      await expect(
        pool.execute(
          { id: "task-1", type: "analysis", priority: "high", input: {} },
          async () => {
            throw new Error("Execution failed");
          },
        ),
      ).rejects.toThrow("Execution failed");

      const metrics = pool.getMetrics();
      expect(metrics.tasksFailed).toBe(1);
    });
  });

  describe("concurrency limits", () => {
    it("limits concurrent task execution to maxWorkers", async () => {
      const pool = new WorkerPool({ maxWorkers: 2 });
      let concurrency = 0;
      let maxObservedConcurrency = 0;

      const trackConcurrency = async () => {
        concurrency++;
        maxObservedConcurrency = Math.max(maxObservedConcurrency, concurrency);
        await new Promise((resolve) => setTimeout(resolve, 50));
        concurrency--;
      };

      // Submit 5 tasks simultaneously
      const promises = Array.from({ length: 5 }, (_, i) =>
        pool.execute(
          {
            id: `task-${i}`,
            type: "analysis",
            priority: "medium",
            input: {},
          },
          trackConcurrency,
        ),
      );

      await Promise.all(promises);

      expect(maxObservedConcurrency).toBeLessThanOrEqual(2);
      expect(pool.getMetrics().tasksExecuted).toBe(5);
    });

    it("queues tasks when workers are busy", async () => {
      const pool = new WorkerPool({ maxWorkers: 1 });
      let activeCount = 0;

      const slowTask = async () => {
        activeCount++;
        await new Promise((resolve) => setTimeout(resolve, 50));
        activeCount--;
        return { success: true, data: "done" };
      };

      const promises = Array.from({ length: 3 }, (_, i) =>
        pool.execute(
          {
            id: `task-${i}`,
            type: "analysis",
            priority: "low",
            input: {},
          },
          slowTask,
        ),
      );

      // After a tick, one task should be active and the rest queued
      await new Promise((resolve) => setTimeout(resolve, 10));

      // At most 1 active, the rest enqueued
      expect(activeCount).toBeLessThanOrEqual(1);

      await Promise.all(promises);

      // Capture metrics AFTER all tasks complete
      const metrics = pool.getMetrics();
      expect(metrics.tasksExecuted).toBe(3);
    });
  });

  describe("shutdown", () => {
    it("terminates and prevents new executions", async () => {
      const pool = new WorkerPool({ maxWorkers: 2 });

      pool.shutdown();

      await expect(
        pool.execute(
          { id: "task-1", type: "analysis", priority: "high", input: {} },
          async () => ({ success: true, data: "done" }),
        ),
      ).rejects.toThrow("Worker pool is shut down");
    });
  });
});
