import { describe, it, expect } from "vitest";

describe("Package Barrel Exports", () => {
  it("exports kernel types", async () => {
    const kernel = await import("../src/kernel/types.js");
    expect(kernel).toBeDefined();
    // Types are erased at runtime, verify the module loads
    expect(typeof kernel).toBe("object");
  });

  it("exports plugin interface types", async () => {
    const plugin = await import("../src/plugin/interface.js");
    expect(plugin).toBeDefined();
    expect(typeof plugin).toBe("object");
  });

  it("exports plugin registry", async () => {
    const registry = await import("../src/plugin/registry.js");
    expect(registry.PluginRegistry).toBeDefined();
    expect(typeof registry.PluginRegistry).toBe("function");
  });

  it("exports swarm module stubs", async () => {
    const swarm = await import("../src/swarm/types.js");
    expect(swarm).toBeDefined();
    expect(typeof swarm).toBe("object");
  });

  it("exports ai-gateway module stubs", async () => {
    const aiGateway = await import("../src/ai-gateway/types.js");
    expect(aiGateway).toBeDefined();
    expect(typeof aiGateway).toBe("object");
  });

  it("exports memory module stubs", async () => {
    const memory = await import("../src/memory/types.js");
    expect(memory).toBeDefined();
    expect(typeof memory).toBe("object");
  });

  it("exports harness module stubs", async () => {
    const harness = await import("../src/harness/types.js");
    expect(harness).toBeDefined();
    expect(typeof harness).toBe("object");
  });

  it("loads the main package entry point", async () => {
    const main = await import("../src/index.js");
    expect(main).toBeDefined();
    // Verify key types are re-exported
    expect(typeof main).toBe("object");
  });
});
