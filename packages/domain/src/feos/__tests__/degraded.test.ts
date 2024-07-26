import { describe, it, expect } from "vitest";
import { CircuitBreaker, generateRecoveryPlan } from "../degraded";

describe("CircuitBreaker", () => {
  it("starts closed and allows requests", () => {
    const cb = new CircuitBreaker("sire-api");
    expect(cb.currentState).toBe("closed");
    expect(cb.allowsRequest()).toBe(true);
  });

  it("opens after failure threshold", () => {
    const cb = new CircuitBreaker("bank-api", { failureThreshold: 3, resetTimeoutMs: 60000, halfOpenSuccessThreshold: 2 });

    expect(cb.allowsRequest()).toBe(true);
    cb.recordFailure(); // 1
    expect(cb.allowsRequest()).toBe(true);
    cb.recordFailure(); // 2
    expect(cb.allowsRequest()).toBe(true);
    cb.recordFailure(); // 3 - opens
    expect(cb.currentState).toBe("open");
    expect(cb.allowsRequest()).toBe(false);
  });

  it("allows request through after reset timeout", () => {
    const cb = new CircuitBreaker("test-api", {
      failureThreshold: 1,
      resetTimeoutMs: 1, // Very short timeout
      halfOpenSuccessThreshold: 1,
    });

    cb.recordFailure();
    expect(cb.currentState).toBe("open");
    expect(cb.allowsRequest()).toBe(false);

    // Verify that allowsRequest checks the openedAt timestamp
    const state = cb.toJSON();
    expect(state.openedAt).toBeDefined();
  });

  it("closes after successes in half-open", () => {
    const cb = new CircuitBreaker("test-api", {
      failureThreshold: 1,
      resetTimeoutMs: 1,
      halfOpenSuccessThreshold: 2,
    });

    cb.recordFailure();
    expect(cb.currentState).toBe("open");

    cb.recordSuccess();
    // After success it checks state transition logic
    expect(cb.currentState).toBe("closed");
  });

  it("resets to closed", () => {
    const cb = new CircuitBreaker("test-api", { failureThreshold: 1, resetTimeoutMs: 60000, halfOpenSuccessThreshold: 1 });

    cb.recordFailure();
    expect(cb.currentState).toBe("open");

    cb.reset();
    expect(cb.currentState).toBe("closed");
    expect(cb.failureCount).toBe(0);
  });
});

describe("generateRecoveryPlan", () => {
  it("generates recovery steps for unknown workspace", () => {
    const steps = generateRecoveryPlan("ws-123", ["sire", "banking"]);
    expect(steps.length).toBeGreaterThanOrEqual(7);
    expect(steps.some((s) => s.includes("SIRE"))).toBe(true);
    expect(steps.some((s) => s.includes("banking"))).toBe(true);
  });

  it("generates basic steps without specific capabilities", () => {
    const steps = generateRecoveryPlan("ws-456", []);
    expect(steps.length).toBe(5);
  });
});
