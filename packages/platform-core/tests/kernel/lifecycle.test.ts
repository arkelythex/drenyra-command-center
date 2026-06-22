import { describe, it, expect } from "vitest";
import {
  AgentLifecycleManager,
  type LifecycleTransition,
  VALID_TRANSITIONS,
} from "../../src/kernel/lifecycle.js";

describe("AgentLifecycleManager", () => {
  describe("initial state", () => {
    it("starts in idle state by default", () => {
      const manager = new AgentLifecycleManager();
      expect(manager.getStatus()).toBe("idle");
    });

    it("accepts an initial status override", () => {
      const manager = new AgentLifecycleManager("offline");
      expect(manager.getStatus()).toBe("offline");
    });

    it("rejects an invalid initial status", () => {
      expect(
        () => new AgentLifecycleManager("invalid" as never),
      ).toThrow("Invalid initial status");
    });
  });

  describe("state transitions", () => {
    it("transitions from idle to busy when assigned a task", () => {
      const manager = new AgentLifecycleManager("idle");
      manager.transitionTo("busy");
      expect(manager.getStatus()).toBe("busy");
    });

    it("transitions from busy to completed on success", () => {
      const manager = new AgentLifecycleManager("busy");
      manager.transitionTo("completed");
      expect(manager.getStatus()).toBe("completed");
    });

    it("transitions from busy to error on failure", () => {
      const manager = new AgentLifecycleManager("busy");
      manager.transitionTo("error");
      expect(manager.getStatus()).toBe("error");
    });

    it("rejects invalid transitions (idle → completed)", () => {
      const manager = new AgentLifecycleManager("idle");
      expect(() => manager.transitionTo("completed")).toThrow(
        "Invalid transition from idle to completed",
      );
    });

    it("rejects invalid transitions (completed → busy)", () => {
      const manager = new AgentLifecycleManager("completed");
      expect(() => manager.transitionTo("busy")).toThrow(
        "Invalid transition from completed to busy",
      );
    });

    it("rejects invalid transitions (error → completed)", () => {
      const manager = new AgentLifecycleManager("error");
      expect(() => manager.transitionTo("completed")).toThrow(
        "Invalid transition from error to completed",
      );
    });
  });

  describe("transition event callbacks", () => {
    it("fires the onTransition callback with the transition details", () => {
      const transitions: LifecycleTransition[] = [];
      const manager = new AgentLifecycleManager("idle", {
        onTransition(transition) {
          transitions.push(transition);
        },
      });

      manager.transitionTo("busy");
      manager.transitionTo("completed");

      expect(transitions).toHaveLength(2);
      expect(transitions[0]).toEqual({
        from: "idle",
        to: "busy",
        timestamp: expect.any(String),
      });
      expect(transitions[1]).toEqual({
        from: "busy",
        to: "completed",
        timestamp: expect.any(String),
      });
    });

    it("fires onError callback when a transition is rejected", () => {
      const errors: string[] = [];
      const manager = new AgentLifecycleManager("idle", {
        onError(message) {
          errors.push(message);
        },
      });

      expect(() => manager.transitionTo("completed")).toThrow();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("Invalid transition from idle to completed");
    });
  });

  describe("VALID_TRANSITIONS", () => {
    it("defines all valid state transitions", () => {
      expect(VALID_TRANSITIONS).toEqual({
        idle: ["busy", "offline"],
        busy: ["completed", "error", "idle"],
        completed: ["idle"],
        error: ["idle"],
        offline: ["idle"],
      });
    });

    it("allows reset from error back to idle", () => {
      const manager = new AgentLifecycleManager("error");
      manager.transitionTo("idle");
      expect(manager.getStatus()).toBe("idle");
    });

    it("allows reset from completed back to idle", () => {
      const manager = new AgentLifecycleManager("completed");
      manager.transitionTo("idle");
      expect(manager.getStatus()).toBe("idle");
    });

    it("allows transition from idle to offline", () => {
      const manager = new AgentLifecycleManager("idle");
      manager.transitionTo("offline");
      expect(manager.getStatus()).toBe("offline");
    });

    it("allows transition from busy to idle (retry/reset)", () => {
      const manager = new AgentLifecycleManager("busy");
      manager.transitionTo("idle");
      expect(manager.getStatus()).toBe("idle");
    });
  });

  describe("full lifecycle", () => {
    it("follows the full agent lifecycle: idle → busy → completed", () => {
      const manager = new AgentLifecycleManager("idle");

      manager.transitionTo("busy");
      expect(manager.getStatus()).toBe("busy");

      manager.transitionTo("completed");
      expect(manager.getStatus()).toBe("completed");
    });

    it("follows the failure lifecycle: idle → busy → error → idle", () => {
      const manager = new AgentLifecycleManager("idle");

      manager.transitionTo("busy");
      expect(manager.getStatus()).toBe("busy");

      manager.transitionTo("error");
      expect(manager.getStatus()).toBe("error");

      // Reset for retry
      manager.transitionTo("idle");
      expect(manager.getStatus()).toBe("idle");
    });
  });
});
