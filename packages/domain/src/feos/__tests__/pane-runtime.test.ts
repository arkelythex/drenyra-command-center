import { describe, it, expect } from "vitest";
import { Layout, defaultPanes, layoutTemplates, PANE_TYPE } from "../pane-runtime";

describe("FEOS-002: Layout", () => {
  it("creates a layout with default panes", () => {
    const layout = Layout.create({ name: "Test Layout" });
    expect(layout.id).toBeDefined();
    expect(layout.panes.length).toBe(3);
  });

  it("adds and removes panes", () => {
    const layout = Layout.create({ name: "Test" });
    const withNew = layout.addPane({ id: "p4", type: "attention", label: "Attention", position: "bottom", size: 200, minSize: 100, resizable: true, closable: true });
    expect(withNew.panes.length).toBe(4);

    const removed = withNew.removePane("p4");
    expect(removed.panes.length).toBe(3);
  });

  it("changes density mode", () => {
    const layout = Layout.create({ name: "Test" });
    const compact = layout.setDensity("compact");
    expect(compact.densityMode).toBe("compact");
  });

  it("toggles sidebar", () => {
    const layout = Layout.create({ name: "Test" });
    const toggled = layout.toggleSidebar();
    expect(toggled).toBeDefined();
    expect(toggled.id).toBe(layout.id);
  });

  it("provides layout templates", () => {
    const templates = layoutTemplates();
    expect(templates.length).toBe(3);
    expect(templates.some((t) => t.name.includes("Monthly Close"))).toBe(true);
    expect(templates.some((t) => t.name.includes("SIRE Review"))).toBe(true);
  });

  it("serializes and deserializes", () => {
    const layout = Layout.create({ name: "Serializable" });
    const json = layout.serialize();
    const restored = Layout.deserialize(json);
    expect(restored.id).toBe(layout.id);
    expect(restored.panes.length).toBe(3);
  });
});
