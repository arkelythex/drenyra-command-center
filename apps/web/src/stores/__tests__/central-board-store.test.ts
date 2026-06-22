import { describe, it, expect, beforeEach } from "vitest";
import { useCentralBoardStore } from "../central-board-store";
import type { JournalEntry, DocumentItem } from "../central-board-store";

const STORAGE_KEY = "codex-central-board-state";

function readPersistedState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function createMockJournalEntry(
  overrides?: Partial<JournalEntry>,
): JournalEntry {
  return {
    id: "je-1",
    date: "2026-04-15",
    cuenta: "10",
    glosa: "Test entry",
    debe: 1000,
    haber: 0,
    status: "pending",
    proposedBy: "agent-1",
    createdAt: "2026-04-15T10:00:00Z",
    ...overrides,
  };
}

function createMockDocument(overrides?: Partial<DocumentItem>): DocumentItem {
  return {
    id: "doc-1",
    name: "invoice.pdf",
    type: "pdf",
    size: 1024,
    uploadedAt: "2026-04-15T10:00:00Z",
    status: "ready",
    ...overrides,
  };
}

describe("CentralBoardStore", () => {
  beforeEach(() => {
    useCentralBoardStore.setState({
      centralBoardTab: "ledger",
      splitRatio: 0.5,
      journalEntries: [],
      documents: [],
    });
  });

  it("should set central board tab", () => {
    useCentralBoardStore.getState().setCentralBoardTab("journal");
    expect(useCentralBoardStore.getState().centralBoardTab).toBe("journal");

    useCentralBoardStore.getState().setCentralBoardTab("documents");
    expect(useCentralBoardStore.getState().centralBoardTab).toBe("documents");

    useCentralBoardStore.getState().setCentralBoardTab("ledger");
    expect(useCentralBoardStore.getState().centralBoardTab).toBe("ledger");
  });

  it("should set split ratio clamped between 0.3 and 0.7", () => {
    useCentralBoardStore.getState().setSplitRatio(0.5);
    expect(useCentralBoardStore.getState().splitRatio).toBe(0.5);

    useCentralBoardStore.getState().setSplitRatio(0.1);
    expect(useCentralBoardStore.getState().splitRatio).toBe(0.3);

    useCentralBoardStore.getState().setSplitRatio(0.9);
    expect(useCentralBoardStore.getState().splitRatio).toBe(0.7);

    useCentralBoardStore.getState().setSplitRatio(0.3);
    expect(useCentralBoardStore.getState().splitRatio).toBe(0.3);

    useCentralBoardStore.getState().setSplitRatio(0.7);
    expect(useCentralBoardStore.getState().splitRatio).toBe(0.7);
  });

  it("should add a journal entry", () => {
    const entry = createMockJournalEntry();
    useCentralBoardStore.getState().addJournalEntry(entry);
    expect(useCentralBoardStore.getState().journalEntries).toHaveLength(1);
  });

  it("should update a journal entry", () => {
    const entry = createMockJournalEntry();
    useCentralBoardStore.getState().addJournalEntry(entry);
    useCentralBoardStore.getState().updateJournalEntry("je-1", { glosa: "Updated" });
    expect(useCentralBoardStore.getState().journalEntries[0].glosa).toBe("Updated");
  });

  it("should approve a journal entry", () => {
    const entry = createMockJournalEntry();
    useCentralBoardStore.getState().addJournalEntry(entry);
    useCentralBoardStore.getState().approveJournalEntry("je-1");
    expect(useCentralBoardStore.getState().journalEntries[0].status).toBe(
      "approved",
    );
  });

  it("should reject a journal entry", () => {
    const entry = createMockJournalEntry();
    useCentralBoardStore.getState().addJournalEntry(entry);
    useCentralBoardStore.getState().rejectJournalEntry("je-1");
    expect(useCentralBoardStore.getState().journalEntries[0].status).toBe(
      "rejected",
    );
  });

  it("should add a document", () => {
    const doc = createMockDocument();
    useCentralBoardStore.getState().addDocument(doc);
    expect(useCentralBoardStore.getState().documents).toHaveLength(1);
  });

  it("should update a document", () => {
    const doc = createMockDocument();
    useCentralBoardStore.getState().addDocument(doc);
    useCentralBoardStore.getState().updateDocument("doc-1", {
      status: "processing",
    });
    expect(useCentralBoardStore.getState().documents[0].status).toBe(
      "processing",
    );
  });

  it("should remove a document", () => {
    const doc = createMockDocument();
    useCentralBoardStore.getState().addDocument(doc);
    useCentralBoardStore.getState().removeDocument("doc-1");
    expect(useCentralBoardStore.getState().documents).toHaveLength(0);
  });

  it("should not affect other entries when approving one", () => {
    const e1 = createMockJournalEntry({
      id: "je-1",
      status: "pending",
    });
    const e2 = createMockJournalEntry({
      id: "je-2",
      status: "pending",
    });
    useCentralBoardStore.getState().addJournalEntry(e1);
    useCentralBoardStore.getState().addJournalEntry(e2);

    useCentralBoardStore.getState().rejectJournalEntry("je-2");
    expect(
      useCentralBoardStore.getState().journalEntries.find((e) => e.id === "je-1")
        ?.status,
    ).toBe("pending");
    expect(
      useCentralBoardStore.getState().journalEntries.find((e) => e.id === "je-2")
        ?.status,
    ).toBe("rejected");
  });

  it("should only persist centralBoardTab and splitRatio", () => {
    // Set tab and split (persisted fields)
    useCentralBoardStore.getState().setCentralBoardTab("journal");
    useCentralBoardStore.getState().setSplitRatio(0.6);

    // Add transient data (should NOT persist)
    useCentralBoardStore.getState().addJournalEntry(createMockJournalEntry());
    useCentralBoardStore.getState().addDocument(createMockDocument());

    const persisted = readPersistedState();
    expect(persisted).not.toBeNull();

    // These SHOULD persist
    expect(persisted.state.centralBoardTab).toBe("journal");
    expect(persisted.state.splitRatio).toBe(0.6);

    // These should NOT persist (transient data)
    expect(persisted.state).not.toHaveProperty("journalEntries");
    expect(persisted.state).not.toHaveProperty("documents");
  });
});
