import { describe, it, expect, beforeEach } from "vitest";
import { useArtifactStore } from "../artifact-store";
import type { HubArtifact } from "@/features/cognitive-hub/types/hub.types";

const STORAGE_KEY = "codex-artifact-state";

function readPersistedState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function createMockArtifact(overrides?: Partial<HubArtifact>): HubArtifact {
  return {
    id: "artifact-1",
    title: "Test Artifact",
    type: "explanation",
    content: "Test content",
    ...overrides,
  } as HubArtifact;
}

describe("ArtifactStore", () => {
  beforeEach(() => {
    useArtifactStore.setState({
      artifactCollapsed: {},
      pinnedArtifacts: [],
      density: "normal",
      activeArtifactId: null,
    });
  });

  it("should set artifact collapsed state", () => {
    useArtifactStore.getState().setArtifactCollapsed("art-1", true);
    expect(useArtifactStore.getState().artifactCollapsed["art-1"]).toBe(true);
  });

  it("should set artifact collapsed state to false", () => {
    useArtifactStore.getState().setArtifactCollapsed("art-1", false);
    expect(useArtifactStore.getState().artifactCollapsed["art-1"]).toBe(false);
  });

  it("should toggle artifact collapsed state", () => {
    useArtifactStore.getState().toggleArtifactCollapsed("art-1");
    expect(useArtifactStore.getState().artifactCollapsed["art-1"]).toBe(true);

    useArtifactStore.getState().toggleArtifactCollapsed("art-1");
    expect(useArtifactStore.getState().artifactCollapsed["art-1"]).toBe(false);
  });

  it("should pin an artifact", () => {
    const artifact = createMockArtifact();
    useArtifactStore.getState().pinArtifact(artifact);
    expect(useArtifactStore.getState().pinnedArtifacts).toHaveLength(1);
    expect(useArtifactStore.getState().pinnedArtifacts[0].id).toBe("artifact-1");
  });

  it("should not pin the same artifact twice", () => {
    const artifact = createMockArtifact();
    useArtifactStore.getState().pinArtifact(artifact);
    useArtifactStore.getState().pinArtifact(artifact);
    expect(useArtifactStore.getState().pinnedArtifacts).toHaveLength(1);
  });

  it("should unpin an artifact", () => {
    const artifact = createMockArtifact();
    useArtifactStore.getState().pinArtifact(artifact);
    useArtifactStore.getState().unpinArtifact("artifact-1");
    expect(useArtifactStore.getState().pinnedArtifacts).toHaveLength(0);
  });

  it("should set density", () => {
    useArtifactStore.getState().setDensity("compact");
    expect(useArtifactStore.getState().density).toBe("compact");

    useArtifactStore.getState().setDensity("normal");
    expect(useArtifactStore.getState().density).toBe("normal");
  });

  it("should set active artifact id", () => {
    useArtifactStore.getState().setActiveArtifactId("art-123");
    expect(useArtifactStore.getState().activeArtifactId).toBe("art-123");

    useArtifactStore.getState().setActiveArtifactId(null);
    expect(useArtifactStore.getState().activeArtifactId).toBeNull();
  });

  it("should handle multiple pinned artifacts", () => {
    const a1 = createMockArtifact({ id: "a1", title: "First" });
    const a2 = createMockArtifact({ id: "a2", title: "Second" } as HubArtifact);

    useArtifactStore.getState().pinArtifact(a1);
    useArtifactStore.getState().pinArtifact(a2);

    expect(useArtifactStore.getState().pinnedArtifacts).toHaveLength(2);
    expect(useArtifactStore.getState().pinnedArtifacts[1].id).toBe("a2");
  });

  it("should persist all state fields to localStorage", () => {
    useArtifactStore.getState().setDensity("compact");
    useArtifactStore.getState().setArtifactCollapsed("art-1", true);
    useArtifactStore.getState().setActiveArtifactId("art-active");

    const persisted = readPersistedState();
    expect(persisted).not.toBeNull();
    expect(persisted.state.density).toBe("compact");
    expect(persisted.state.artifactCollapsed["art-1"]).toBe(true);
    expect(persisted.state.activeArtifactId).toBe("art-active");
    expect(persisted.state.pinnedArtifacts).toBeDefined();
  });
});
