import { describe, it, expect } from "vitest";
import { ModelRegistry } from "../../src/ai-gateway/registry.js";
import type { ModelRegistration } from "../../src/ai-gateway/registry.js";

describe("ModelRegistry", () => {
  const flashModel: ModelRegistration = {
    id: "gemini-3-flash",
    name: "Gemini 3 Flash",
    provider: "google",
    capabilities: ["chat", "streaming"],
    cost: { costPer1MInput: 0.1, costPer1MOutput: 0.4 },
  };

  const reasoningModel: ModelRegistration = {
    id: "claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    provider: "anthropic",
    capabilities: ["chat", "reasoning", "streaming"],
    cost: { costPer1MInput: 3.0, costPer1MOutput: 15.0 },
    rateLimits: { requestsPerMinute: 50, tokensPerMinute: 20000 },
  };

  const opusModel: ModelRegistration = {
    id: "claude-opus-4.5",
    name: "Claude Opus 4.5",
    provider: "anthropic",
    capabilities: ["chat", "reasoning", "analysis", "streaming"],
    cost: { costPer1MInput: 5.0, costPer1MOutput: 25.0 },
  };

  describe("register", () => {
    it("registers a single model", () => {
      const registry = new ModelRegistry();
      registry.register(flashModel);
      expect(registry.get("gemini-3-flash")).toBeDefined();
    });

    it("registers multiple models", () => {
      const registry = new ModelRegistry();
      registry.register(flashModel);
      registry.register(reasoningModel);
      expect(registry.list()).toHaveLength(2);
    });

    it("overwrites an existing model when registering with the same id", () => {
      const registry = new ModelRegistry();
      registry.register(flashModel);
      const updated: ModelRegistration = {
        ...flashModel,
        name: "Gemini 3 Flash Updated",
      };
      registry.register(updated);
      expect(registry.get("gemini-3-flash")!.name).toBe("Gemini 3 Flash Updated");
    });
  });

  describe("get", () => {
    it("returns undefined for unknown model id", () => {
      const registry = new ModelRegistry();
      expect(registry.get("non-existent")).toBeUndefined();
    });

    it("returns the registered model by id", () => {
      const registry = new ModelRegistry();
      registry.register(flashModel);
      const model = registry.get("gemini-3-flash");
      expect(model).toBeDefined();
      expect(model!.provider).toBe("google");
      expect(model!.cost.costPer1MInput).toBe(0.1);
    });
  });

  describe("list", () => {
    it("returns an empty array when no models are registered", () => {
      const registry = new ModelRegistry();
      expect(registry.list()).toEqual([]);
    });

    it("returns all registered models", () => {
      const registry = new ModelRegistry();
      registry.register(flashModel);
      registry.register(reasoningModel);
      const models = registry.list();
      expect(models).toHaveLength(2);
      expect(models.map((m) => m.id)).toContain("gemini-3-flash");
      expect(models.map((m) => m.id)).toContain("claude-sonnet-4.5");
    });
  });

  describe("selectByCapability", () => {
    it("returns an empty array when no models match capability", () => {
      const registry = new ModelRegistry();
      registry.register(flashModel);
      const result = registry.selectByCapability(["vision"]);
      expect(result).toEqual([]);
    });

    it("returns all models that have ALL required capabilities", () => {
      const registry = new ModelRegistry();
      registry.register(flashModel);
      registry.register(reasoningModel);
      registry.register(opusModel);

      const reasoningModels = registry.selectByCapability(["reasoning"]);
      expect(reasoningModels).toHaveLength(2);
      expect(reasoningModels.map((m) => m.id)).toContain("claude-sonnet-4.5");
      expect(reasoningModels.map((m) => m.id)).toContain("claude-opus-4.5");
    });

    it("returns models sorted by cost ascending when multiple match", () => {
      const registry = new ModelRegistry();
      registry.register(opusModel); // $30 total
      registry.register(reasoningModel); // $18 total
      registry.register(flashModel); // $0.5 total

      const chatModels = registry.selectByCapability(["chat"]);
      expect(chatModels).toHaveLength(3);
      // Should be sorted by cost ascending: flash, sonnet, opus
      expect(chatModels[0].id).toBe("gemini-3-flash");
      expect(chatModels[2].id).toBe("claude-opus-4.5");
    });
  });

  describe("remove", () => {
    it("returns false when removing a non-existent model", () => {
      const registry = new ModelRegistry();
      expect(registry.remove("non-existent")).toBe(false);
    });

    it("removes a registered model and returns true", () => {
      const registry = new ModelRegistry();
      registry.register(flashModel);
      expect(registry.remove("gemini-3-flash")).toBe(true);
      expect(registry.get("gemini-3-flash")).toBeUndefined();
      expect(registry.list()).toHaveLength(0);
    });
  });

  describe("rateLimit configuration", () => {
    it("stores rate limits when provided", () => {
      const registry = new ModelRegistry();
      registry.register(reasoningModel);
      const model = registry.get("claude-sonnet-4.5");
      expect(model!.rateLimits).toBeDefined();
      expect(model!.rateLimits!.requestsPerMinute).toBe(50);
      expect(model!.rateLimits!.tokensPerMinute).toBe(20000);
    });

    it("stores models without rate limits", () => {
      const registry = new ModelRegistry();
      registry.register(flashModel);
      const model = registry.get("gemini-3-flash");
      expect(model!.rateLimits).toBeUndefined();
    });
  });
});
