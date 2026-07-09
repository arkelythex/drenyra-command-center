package memory

import (
	"context"
	"strings"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/history"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/memorystore"
)

// DBStatus is the local SQLite operational memory status.
type DBStatus = memorystore.Status

// SearchResult is one local SQLite/FTS memory match.
type SearchResult = memorystore.SearchResult

// Run is one harness execution to persist in local session memory.
type Run struct {
	Task      string
	RootAgent string
	AutoLevel string
	TraceID   string
	Status    string
}

// LoadSnapshot returns the bounded Markdown memory snapshot for harness injection.
func LoadSnapshot() (Snapshot, error) {
	return Load()
}

// LoadSnapshotReadOnly returns the bounded Markdown memory snapshot without creating files.
func LoadSnapshotReadOnly() (Snapshot, error) {
	return LoadReadOnly()
}

// BuildMetadata merges caller metadata with the current Markdown memory snapshot.
func BuildMetadata(base map[string]any) (map[string]any, Snapshot, error) {
	snap, err := LoadSnapshot()
	if err != nil {
		return base, Snapshot{}, err
	}
	out := map[string]any{}
	for k, v := range base {
		out[k] = v
	}
	for k, v := range Metadata(snap) {
		out[k] = v
	}
	return out, snap, nil
}

// RecordRun appends to history.jsonl and mirrors to SQLite/FTS best-effort.
func RecordRun(ctx context.Context, run Run) {
	_ = history.Append(history.Entry{
		Task:      run.Task,
		RootAgent: run.RootAgent,
		AutoLevel: run.AutoLevel,
		TraceID:   run.TraceID,
		Status:    run.Status,
	})
	store, err := memorystore.OpenDefault()
	if err != nil {
		return
	}
	defer store.Close()
	_, _ = store.RecordRun(ctx, memorystore.Run{
		Task:      run.Task,
		RootAgent: run.RootAgent,
		AutoLevel: run.AutoLevel,
		TraceID:   run.TraceID,
		Status:    run.Status,
	})
}

// LocalDBStatus opens or initializes the local SQLite memory DB and returns counts.
func LocalDBStatus(ctx context.Context) (DBStatus, error) {
	path, err := memorystore.Path()
	if err != nil {
		return DBStatus{}, err
	}
	store, err := memorystore.Open(path)
	if err != nil {
		return DBStatus{Path: path}, err
	}
	defer store.Close()
	return store.Status(ctx, path)
}

// LocalDBStatusReadOnly returns counts for an existing SQLite memory DB without creating it.
func LocalDBStatusReadOnly(ctx context.Context) (DBStatus, error) {
	path, err := memorystore.Path()
	if err != nil {
		return DBStatus{}, err
	}
	store, err := memorystore.OpenReadOnly(path)
	if err != nil {
		return DBStatus{Path: path}, err
	}
	defer store.Close()
	return store.Status(ctx, path)
}

// SearchLocalDB searches the local SQLite/FTS memory DB, creating it if needed.
func SearchLocalDB(ctx context.Context, query string, limit int) ([]SearchResult, error) {
	store, err := memorystore.OpenDefault()
	if err != nil {
		return nil, err
	}
	defer store.Close()
	return store.Search(ctx, query, limit)
}

// SearchLocalDBReadOnly searches an existing local SQLite/FTS memory DB without creating it.
func SearchLocalDBReadOnly(ctx context.Context, query string, limit int) ([]SearchResult, error) {
	store, err := memorystore.OpenDefaultReadOnly()
	if err != nil {
		return nil, err
	}
	defer store.Close()
	return store.Search(ctx, query, limit)
}

// RebuildMemoryTarget replaces the SQLite/FTS mirror for one Markdown memory target.
func RebuildMemoryTarget(ctx context.Context, target Target) error {
	st, err := DefaultStore()
	if err != nil {
		return err
	}
	entries, err := st.ListEntries(target)
	if err != nil {
		return err
	}
	rows := make([]memorystore.Memory, 0, len(entries))
	for _, entry := range entries {
		entry = strings.TrimSpace(entry)
		if entry == "" {
			continue
		}
		rows = append(rows, memorystore.Memory{
			Scope:   string(target),
			Title:   titleFromContent(entry, 64),
			Content: entry,
		})
	}
	store, err := memorystore.OpenDefault()
	if err != nil {
		return err
	}
	defer store.Close()
	return store.ReplaceMemoriesForScope(ctx, string(target), rows)
}

// RebuildMarkdownMemory mirrors all Markdown memory targets into SQLite/FTS.
func RebuildMarkdownMemory(ctx context.Context) error {
	if err := RebuildMemoryTarget(ctx, TargetMemory); err != nil {
		return err
	}
	return RebuildMemoryTarget(ctx, TargetUser)
}

func titleFromContent(content string, limit int) string {
	content = strings.TrimSpace(strings.ReplaceAll(content, "\n", " "))
	if limit <= 0 || len(content) <= limit {
		return content
	}
	if limit <= 3 {
		return content[:limit]
	}
	return content[:limit-3] + "..."
}
