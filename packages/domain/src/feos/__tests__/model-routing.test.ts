import { describe, it, expect } from "vitest";
import { ModelRouter, DRENYRA_MODEL_REGISTRY } from "../model-routing";

describe("ModelRouter", () => {
  it("routes R0 tasks to flash tier", () => {
    const router = new ModelRouter();
    const result = router.route({ riskLevel: "R0", taskType: "classification" });

    expect(result.tier).toBe("flash");
    expect(result.selectedModel).toBeDefined();
    expect(result.alternatives.length).toBeGreaterThan(0);
  });

  it("routes R1 tasks to flash or reasoning", () => {
    const router = new ModelRouter();
    const result = router.route({ riskLevel: "R1", taskType: "extraction" });

    expect(["flash", "reasoning"]).toContain(result.tier);
  });

  it("routes R2 tasks to constrained-output models", () => {
    const router = new ModelRouter();
    const result = router.route({ riskLevel: "R2", taskType: "validation" });

    const model = router.getModel(result.selectedModel);
    expect(model?.capabilities.supportsConstrainedOutput).toBe(true);
    expect(model?.capabilities.supportsJsonSchema).toBe(true);
  });

  it("routes R3 tasks with tool calling capability", () => {
    const router = new ModelRouter();
    const result = router.route({ riskLevel: "R3", taskType: "judgment_day" });

    const model = router.getModel(result.selectedModel);
    expect(model?.capabilities.supportsConstrainedOutput).toBe(true);
    expect(model?.capabilities.supportsToolCalling).toBe(true);
  });

  it("filters by required capabilities", () => {
    const router = new ModelRouter();
    const result = router.route({
      riskLevel: "R1",
      taskType: "ocr",
      requiredCapabilities: ["ocr"],
    });

    const model = router.getModel(result.selectedModel);
    expect(model?.tags).toContain("ocr");
  });

  it("throws when no suitable model exists", () => {
    const router = new ModelRouter([]);
    expect(() => router.route({ riskLevel: "R0", taskType: "anything" }))
      .toThrow();
  });

  it("tracks and reports costs", () => {
    const router = new ModelRouter();

    router.trackCost({
      modelId: "gemini-2.0-flash", provider: "google",
      inputTokens: 1000, outputTokens: 500, cost: 0.001, currency: "USD",
      workspaceId: "ws-1", traceId: "trace-1", toolName: "classify",
    });

    router.trackCost({
      modelId: "deepseek-v4-pro", provider: "deepseek",
      inputTokens: 500, outputTokens: 200, cost: 0.008, currency: "USD",
      workspaceId: "ws-1", traceId: "trace-2", toolName: "analyze",
    });

    expect(router.getWorkspaceCost("ws-1")).toBeCloseTo(0.009);
    expect(router.getTotalCost()).toBeCloseTo(0.009);
  });

  it("returns available models", () => {
    const router = new ModelRouter();
    const available = router.listAvailable();
    expect(available.length).toBeGreaterThan(0);
    expect(available.every((m) => m.available)).toBe(true);
  });
});
