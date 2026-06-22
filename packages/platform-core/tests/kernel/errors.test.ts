import { describe, it, expect } from "vitest";
import {
  PluginValidationError,
  AgentError,
  TaskError,
  isPluginValidationError,
  isAgentError,
  isTaskError,
} from "../../src/kernel/errors.js";

describe("Error Hierarchy", () => {
  describe("PluginValidationError", () => {
    it("creates an error with the correct name and message", () => {
      const error = new PluginValidationError("Domain name is required");

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("PluginValidationError");
      expect(error.message).toBe("Domain name is required");
    });

    it("preserves the plugin name when provided", () => {
      const error = new PluginValidationError(
        "Domain name is required",
        "fiscal-plugin",
      );

      expect(error.message).toBe("Domain name is required");
      expect(error.pluginName).toBe("fiscal-plugin");
    });

    it("is identified by the type guard", () => {
      const error = new PluginValidationError("test");

      expect(isPluginValidationError(error)).toBe(true);
      expect(isPluginValidationError(new Error("plain"))).toBe(false);
      expect(isAgentError(error)).toBe(false);
      expect(isTaskError(error)).toBe(false);
    });

    it("includes the plugin name in the message when set", () => {
      const error = new PluginValidationError(
        "Invalid domain",
        "my-plugin",
      );

      expect(error.message).toContain("Invalid domain");
    });
  });

  describe("AgentError", () => {
    it("creates an error with the correct name and message", () => {
      const error = new AgentError("Agent not found");

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("AgentError");
      expect(error.message).toBe("Agent not found");
    });

    it("preserves the agent ID when provided", () => {
      const error = new AgentError(
        "Execution failed",
        "agent-42",
      );

      expect(error.message).toBe("Execution failed");
      expect(error.agentId).toBe("agent-42");
    });

    it("is identified by the type guard", () => {
      const error = new AgentError("test");

      expect(isAgentError(error)).toBe(true);
      expect(isAgentError(new Error("plain"))).toBe(false);
      expect(isPluginValidationError(error)).toBe(false);
      expect(isTaskError(error)).toBe(false);
    });

    it("accepts an optional cause", () => {
      const cause = new Error("Underlying network failure");
      const error = new AgentError("Agent communication lost", "agent-7", cause);

      expect(error.message).toBe("Agent communication lost");
      expect(error.agentId).toBe("agent-7");
      expect(error.cause).toBe(cause);
    });
  });

  describe("TaskError", () => {
    it("creates an error with the correct name and message", () => {
      const error = new TaskError("Task timeout");

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("TaskError");
      expect(error.message).toBe("Task timeout");
    });

    it("preserves the task ID when provided", () => {
      const error = new TaskError("Task failed", "task-99");

      expect(error.message).toBe("Task failed");
      expect(error.taskId).toBe("task-99");
    });

    it("is identified by the type guard", () => {
      const error = new TaskError("test");

      expect(isTaskError(error)).toBe(true);
      expect(isTaskError(new Error("plain"))).toBe(false);
      expect(isPluginValidationError(error)).toBe(false);
      expect(isAgentError(error)).toBe(false);
    });

    it("differentiates from generic errors using type guards", () => {
      const pluginErr = new PluginValidationError("plugin issue");
      const agentErr = new AgentError("agent issue");
      const taskErr = new TaskError("task issue");
      const genericErr = new Error("generic issue");

      expect(isPluginValidationError(pluginErr)).toBe(true);
      expect(isPluginValidationError(agentErr)).toBe(false);
      expect(isPluginValidationError(taskErr)).toBe(false);
      expect(isPluginValidationError(genericErr)).toBe(false);

      expect(isAgentError(pluginErr)).toBe(false);
      expect(isAgentError(agentErr)).toBe(true);
      expect(isAgentError(taskErr)).toBe(false);
      expect(isAgentError(genericErr)).toBe(false);

      expect(isTaskError(pluginErr)).toBe(false);
      expect(isTaskError(agentErr)).toBe(false);
      expect(isTaskError(taskErr)).toBe(true);
      expect(isTaskError(genericErr)).toBe(false);
    });

    it("subclass chain preserves instanceof checks", () => {
      const error = new TaskError("subclass test", "task-1");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(TaskError);
      expect(error).not.toBeInstanceOf(PluginValidationError);
      expect(error).not.toBeInstanceOf(AgentError);
    });
  });
});
