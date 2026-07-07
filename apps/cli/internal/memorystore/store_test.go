package memorystore

import (
	"context"
	"path/filepath"
	"testing"
)

func TestStoreInitStatusAndSearch(t *testing.T) {
	ctx := context.Background()
	path := filepath.Join(t.TempDir(), "drenyra.db")
	store, err := Open(path)
	if err != nil {
		t.Fatalf("Open() error = %v", err)
	}
	defer store.Close()

	if _, err := store.UpsertMemory(ctx, Memory{Scope: "project", Title: "Fiscal guard", Content: "SIRE exports need RUC scoping"}); err != nil {
		t.Fatalf("UpsertMemory() error = %v", err)
	}
	if _, err := store.RecordDecision(ctx, Decision{Title: "Use Drenyra CLI", Content: "Product workflows live in Drenyra CLI"}); err != nil {
		t.Fatalf("RecordDecision() error = %v", err)
	}
	if _, err := store.RecordBug(ctx, Bug{Title: "Prompt q quits", RootCause: "global q handler", Fix: "scope q to menu focus"}); err != nil {
		t.Fatalf("RecordBug() error = %v", err)
	}
	if _, err := store.RecordRun(ctx, Run{Task: "review SIRE", RootAgent: "fiscal-command-orchestrator", AutoLevel: "medium", Status: "done"}); err != nil {
		t.Fatalf("RecordRun() error = %v", err)
	}

	status, err := store.Status(ctx, path)
	if err != nil {
		t.Fatalf("Status() error = %v", err)
	}
	if status.Path != path || status.Memories != 1 || status.Decisions != 1 || status.Bugs != 1 || status.Runs != 1 {
		t.Fatalf("status = %#v", status)
	}

	results, err := store.Search(ctx, "SIRE", 10)
	if err != nil {
		t.Fatalf("Search() error = %v", err)
	}
	if len(results) == 0 {
		t.Fatal("Search(SIRE) returned no results")
	}
}

func TestOpenReadOnly(t *testing.T) {
	ctx := context.Background()
	path := filepath.Join(t.TempDir(), "drenyra.db")
	store, err := Open(path)
	if err != nil {
		t.Fatalf("Open() error = %v", err)
	}
	if _, err := store.UpsertMemory(ctx, Memory{Title: "Read only", Content: "searchable content"}); err != nil {
		t.Fatalf("UpsertMemory() error = %v", err)
	}
	if err := store.Close(); err != nil {
		t.Fatalf("Close() error = %v", err)
	}

	readOnly, err := OpenReadOnly(path)
	if err != nil {
		t.Fatalf("OpenReadOnly() error = %v", err)
	}
	defer readOnly.Close()

	results, err := readOnly.Search(ctx, "searchable", 10)
	if err != nil {
		t.Fatalf("Search() error = %v", err)
	}
	if len(results) != 1 || results[0].Title != "Read only" {
		t.Fatalf("results = %#v", results)
	}
}

func TestReplaceMemoriesForScopePurgesStaleFTSRows(t *testing.T) {
	ctx := context.Background()
	store, err := Open(filepath.Join(t.TempDir(), "drenyra.db"))
	if err != nil {
		t.Fatalf("Open() error = %v", err)
	}
	defer store.Close()

	if _, err := store.UpsertMemory(ctx, Memory{Scope: "memory", Title: "Old", Content: "stalephrase should disappear"}); err != nil {
		t.Fatalf("UpsertMemory() error = %v", err)
	}
	if err := store.ReplaceMemoriesForScope(ctx, "memory", []Memory{{Scope: "memory", Title: "New", Content: "freshphrase should remain"}}); err != nil {
		t.Fatalf("ReplaceMemoriesForScope() error = %v", err)
	}

	oldResults, err := store.Search(ctx, "stalephrase", 10)
	if err != nil {
		t.Fatalf("Search(stalephrase) error = %v", err)
	}
	if len(oldResults) != 0 {
		t.Fatalf("stale results retained: %#v", oldResults)
	}
	newResults, err := store.Search(ctx, "freshphrase", 10)
	if err != nil {
		t.Fatalf("Search(freshphrase) error = %v", err)
	}
	if len(newResults) != 1 || newResults[0].Kind != "memory" {
		t.Fatalf("fresh results = %#v", newResults)
	}
}

func TestReplaceMemoriesForScopePurgesOrphanFTSRows(t *testing.T) {
	ctx := context.Background()
	store, err := Open(filepath.Join(t.TempDir(), "drenyra.db"))
	if err != nil {
		t.Fatalf("Open() error = %v", err)
	}
	defer store.Close()

	if _, err := store.db.ExecContext(ctx, `INSERT INTO memory_fts (kind, ref_id, title, content) VALUES ('memory', 'missing-row', 'Orphan', 'orphanphrase leaked')`); err != nil {
		t.Fatalf("insert orphan fts: %v", err)
	}
	if err := store.ReplaceMemoriesForScope(ctx, "memory", []Memory{{Scope: "memory", Title: "New", Content: "freshphrase should remain"}}); err != nil {
		t.Fatalf("ReplaceMemoriesForScope() error = %v", err)
	}

	results, err := store.Search(ctx, "orphanphrase", 10)
	if err != nil {
		t.Fatalf("Search(orphanphrase) error = %v", err)
	}
	if len(results) != 0 {
		t.Fatalf("orphan FTS results retained: %#v", results)
	}
}

func TestListMemories(t *testing.T) {
	ctx := context.Background()
	store, err := Open(filepath.Join(t.TempDir(), "drenyra.db"))
	if err != nil {
		t.Fatalf("Open() error = %v", err)
	}
	defer store.Close()

	if _, err := store.UpsertMemory(ctx, Memory{Title: "One", Content: "first"}); err != nil {
		t.Fatalf("UpsertMemory() error = %v", err)
	}
	memories, err := store.ListMemories(ctx, 5)
	if err != nil {
		t.Fatalf("ListMemories() error = %v", err)
	}
	if len(memories) != 1 || memories[0].Title != "One" || memories[0].Scope != "project" {
		t.Fatalf("memories = %#v", memories)
	}
}
