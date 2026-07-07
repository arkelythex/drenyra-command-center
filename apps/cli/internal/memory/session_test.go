package memory

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestLoadSnapshotReadOnlyDoesNotCreateFiles(t *testing.T) {
	home := t.TempDir()
	t.Setenv("HOME", home)

	snap, err := LoadSnapshotReadOnly()
	if err != nil {
		t.Fatalf("LoadSnapshotReadOnly() error = %v", err)
	}
	if snap.MemoryPath == "" || snap.UserPath == "" {
		t.Fatalf("snapshot paths missing: %#v", snap)
	}
	if _, err := os.Stat(filepath.Join(home, ".drenyra")); !os.IsNotExist(err) {
		t.Fatalf("LoadSnapshotReadOnly created runtime files, stat err=%v", err)
	}
}

func TestBuildMetadataUsesSnapshot(t *testing.T) {
	t.Setenv("HOME", t.TempDir())
	meta, snap, err := BuildMetadata(map[string]any{"source": "test"})
	if err != nil {
		t.Fatalf("BuildMetadata() error = %v", err)
	}
	if meta["source"] != "test" {
		t.Fatalf("base metadata missing: %#v", meta)
	}
	if meta["memorySnapshot"] != true || meta["memoryFormat"] != "hermes-v1" {
		t.Fatalf("memory metadata missing: %#v", meta)
	}
	if snap.MemoryPath == "" || snap.UserPath == "" {
		t.Fatalf("snapshot paths missing: %#v", snap)
	}
}

func TestRecordRunWritesHistoryAndSQLite(t *testing.T) {
	home := t.TempDir()
	t.Setenv("HOME", home)
	ctx := context.Background()

	RecordRun(ctx, Run{Task: "review SIRE export", RootAgent: "fiscal-command-orchestrator", AutoLevel: "medium", TraceID: "trace-1", Status: "done"})

	historyPath := filepath.Join(home, ".drenyra", "history.jsonl")
	data, err := os.ReadFile(historyPath)
	if err != nil {
		t.Fatalf("history not written: %v", err)
	}
	if !strings.Contains(string(data), "review SIRE export") {
		t.Fatalf("history = %q", string(data))
	}

	status, err := LocalDBStatus(ctx)
	if err != nil {
		t.Fatalf("LocalDBStatus() error = %v", err)
	}
	if status.Runs != 1 {
		t.Fatalf("runs = %d, want 1", status.Runs)
	}
	results, err := SearchLocalDB(ctx, "SIRE", 5)
	if err != nil {
		t.Fatalf("SearchLocalDB() error = %v", err)
	}
	if len(results) == 0 || results[0].Kind != "run" {
		t.Fatalf("results = %#v", results)
	}
}

func TestRebuildMemoryTargetPurgesReplacedAndRemovedContent(t *testing.T) {
	t.Setenv("HOME", t.TempDir())
	ctx := context.Background()
	st, err := DefaultStore()
	if err != nil {
		t.Fatalf("DefaultStore() error = %v", err)
	}
	if _, err := st.Add(TargetMemory, "stalephrase sensitive note"); err != nil {
		t.Fatalf("Add() error = %v", err)
	}
	if err := RebuildMemoryTarget(ctx, TargetMemory); err != nil {
		t.Fatalf("RebuildMemoryTarget() add error = %v", err)
	}
	if results, err := SearchLocalDB(ctx, "stalephrase", 5); err != nil || len(results) == 0 {
		t.Fatalf("initial search results = %#v err=%v", results, err)
	}

	if _, err := st.Replace(TargetMemory, "stalephrase", "freshphrase replacement note"); err != nil {
		t.Fatalf("Replace() error = %v", err)
	}
	if err := RebuildMemoryTarget(ctx, TargetMemory); err != nil {
		t.Fatalf("RebuildMemoryTarget() replace error = %v", err)
	}
	if results, err := SearchLocalDB(ctx, "stalephrase", 5); err != nil || len(results) != 0 {
		t.Fatalf("stale search results after replace = %#v err=%v", results, err)
	}
	if results, err := SearchLocalDB(ctx, "freshphrase", 5); err != nil || len(results) == 0 {
		t.Fatalf("fresh search results after replace = %#v err=%v", results, err)
	}

	if _, err := st.Remove(TargetMemory, "freshphrase"); err != nil {
		t.Fatalf("Remove() error = %v", err)
	}
	if err := RebuildMemoryTarget(ctx, TargetMemory); err != nil {
		t.Fatalf("RebuildMemoryTarget() remove error = %v", err)
	}
	if results, err := SearchLocalDB(ctx, "freshphrase", 5); err != nil || len(results) != 0 {
		t.Fatalf("fresh search results after remove = %#v err=%v", results, err)
	}
}
