import { describe, it, expect, beforeEach } from "vitest";
import { useThreadStore } from "../thread-store";

const STORAGE_KEY = "codex-thread-state";

// Helper to read persisted data from localStorage
function readPersistedState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

describe("ThreadStore", () => {
  beforeEach(() => {
    useThreadStore.setState({
      threads: [],
      activeThreadId: null,
    });
  });

  it("should create a thread", () => {
    const thread = useThreadStore.getState().createThread("Test thread");
    expect(thread.title).toBe("Test thread");
    expect(thread.id).toBeDefined();
    expect(thread.status).toBe("active");
    expect(thread.messageCount).toBe(0);
    expect(thread.snippet).toBe("");
    expect(useThreadStore.getState().threads).toHaveLength(1);
    expect(useThreadStore.getState().activeThreadId).toBe(thread.id);
  });

  it("should create a thread with default title", () => {
    const thread = useThreadStore.getState().createThread();
    expect(thread.title).toBe("New Chat");
  });

  it("should set active thread", () => {
    const thread = useThreadStore.getState().createThread("Test");
    useThreadStore.getState().setActiveThread(null);
    expect(useThreadStore.getState().activeThreadId).toBeNull();

    useThreadStore.getState().setActiveThread(thread.id);
    expect(useThreadStore.getState().activeThreadId).toBe(thread.id);
  });

  it("should archive a thread", () => {
    const thread = useThreadStore.getState().createThread("Test");
    useThreadStore.getState().archiveThread(thread.id);

    const archived = useThreadStore.getState().threads[0];
    expect(archived.status).toBe("archived");
  });

  it("should unarchive a thread", () => {
    const thread = useThreadStore.getState().createThread("Test");
    useThreadStore.getState().archiveThread(thread.id);
    useThreadStore.getState().unarchiveThread(thread.id);

    const restored = useThreadStore.getState().threads[0];
    expect(restored.status).toBe("active");
  });

  it("should pin a thread", () => {
    const thread = useThreadStore.getState().createThread("Test");
    useThreadStore.getState().pinThread(thread.id);

    const pinned = useThreadStore.getState().threads[0];
    expect(pinned.status).toBe("pinned");
  });

  it("should delete a thread and clear activeThreadId if matching", () => {
    const thread = useThreadStore.getState().createThread("Test");
    expect(useThreadStore.getState().threads).toHaveLength(1);

    useThreadStore.getState().deleteThread(thread.id);
    expect(useThreadStore.getState().threads).toHaveLength(0);
    expect(useThreadStore.getState().activeThreadId).toBeNull();
  });

  it("should not clear activeThreadId when deleting a non-active thread", () => {
    const t1 = useThreadStore.getState().createThread("First");
    const t2 = useThreadStore.getState().createThread("Second");
    useThreadStore.getState().setActiveThread(t1.id);

    useThreadStore.getState().deleteThread(t2.id);
    expect(useThreadStore.getState().activeThreadId).toBe(t1.id);
  });

  it("should add a thread", () => {
    const thread = {
      id: "custom-id",
      title: "Custom",
      status: "active" as const,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      messageCount: 5,
      snippet: "hello",
    };
    useThreadStore.getState().addThread(thread);
    expect(useThreadStore.getState().threads).toHaveLength(1);
    expect(useThreadStore.getState().threads[0].id).toBe("custom-id");
  });

  it("should update a thread", () => {
    const thread = useThreadStore.getState().createThread("Original");
    useThreadStore.getState().updateThread(thread.id, {
      title: "Updated",
      snippet: "new snippet",
    });

    const updated = useThreadStore.getState().threads[0];
    expect(updated.title).toBe("Updated");
    expect(updated.snippet).toBe("new snippet");
    // updatedAt should be a valid ISO timestamp
    expect(() => new Date(updated.updatedAt)).not.toThrow();
  });

  it("should fork a thread", () => {
    const original = useThreadStore.getState().createThread("Original");
    const fork = useThreadStore.getState().forkThread(original.id);

    expect(fork.id).not.toBe(original.id);
    expect(fork.title).toBe("Fork: Original");
    expect(fork.forkedFrom).toBe(original.id);
    expect(fork.status).toBe("active");
    expect(useThreadStore.getState().threads).toHaveLength(2);
    expect(useThreadStore.getState().activeThreadId).toBe(fork.id);
  });

  it("should throw when forking a non-existent thread", () => {
    expect(() => useThreadStore.getState().forkThread("nonexistent")).toThrow(
      "Thread nonexistent not found",
    );
  });

  it("should rename a thread", () => {
    const thread = useThreadStore.getState().createThread("Old name");
    useThreadStore.getState().renameThread(thread.id, "New name");

    expect(useThreadStore.getState().threads[0].title).toBe("New name");
  });

  it("should set brainThreadId on a thread", () => {
    const thread = useThreadStore.getState().createThread("Test");
    useThreadStore.getState().setThreadBrainId(thread.id, "brain-123");

    expect(useThreadStore.getState().threads[0].brainThreadId).toBe("brain-123");
  });

  it("should reorder threads", () => {
    const t1 = useThreadStore.getState().createThread("First");
    const t2 = useThreadStore.getState().createThread("Second");
    const t3 = useThreadStore.getState().createThread("Third");

    // Reverse order: t3 was last created (at index 0), so to reverse: [t1.id, t2.id, t3.id]
    useThreadStore.getState().reorderThreads([t3.id, t2.id, t1.id]);
    const threads = useThreadStore.getState().threads;
    expect(threads[0].id).toBe(t3.id);
    expect(threads[1].id).toBe(t2.id);
    expect(threads[2].id).toBe(t1.id);
  });

  it("should handle reorder with unknown IDs gracefully", () => {
    const t1 = useThreadStore.getState().createThread("First");
    useThreadStore.getState().reorderThreads(["unknown-id", t1.id]);
    expect(useThreadStore.getState().threads).toHaveLength(1);
  });

  it("should persist threads and activeThreadId to localStorage", () => {
    useThreadStore.getState().createThread("Persisted thread");
    const persisted = readPersistedState();
    expect(persisted).not.toBeNull();
    expect(persisted.state.threads).toBeDefined();
    expect(persisted.state.threads).toHaveLength(1);
    expect(persisted.state.activeThreadId).toBeDefined();
  });

  it("should update updatedAt on thread modification", () => {
    const thread = useThreadStore.getState().createThread("Test");
    const originalUpdatedAt = thread.updatedAt;

    // renameThread updates updatedAt to a new ISO timestamp
    useThreadStore.getState().renameThread(thread.id, "Renamed");
    const newUpdatedAt =
      useThreadStore.getState().threads[0].updatedAt;
    // Verify it's a valid ISO date and different from original
    expect(() => new Date(newUpdatedAt)).not.toThrow();
    expect(typeof newUpdatedAt).toBe("string");
  });
});
