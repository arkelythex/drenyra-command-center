package runctx

import (
	"context"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/harness"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/memory"
)

// BuildMetadata merges CLI metadata with Hermes-style memory snapshot.
func BuildMetadata(base map[string]any) (map[string]any, memory.Snapshot, error) {
	return memory.BuildMetadata(base)
}

// RecordRun appends harness history and mirrors to local SQLite memory (best-effort).
func RecordRun(task, root, autoLevel, traceID, status string) {
	memory.RecordRun(context.Background(), memory.Run{
		Task:      task,
		RootAgent: root,
		AutoLevel: autoLevel,
		TraceID:   traceID,
		Status:    status,
	})
}

// ExecuteRequest builds a harness request with memory context.
func ExecuteRequest(task, root string, autoSpawn bool, baseMeta map[string]any) (harness.ExecuteRequest, memory.Snapshot, error) {
	meta, snap, err := BuildMetadata(baseMeta)
	if err != nil {
		return harness.ExecuteRequest{}, memory.Snapshot{}, err
	}
	return harness.ExecuteRequest{
		Task:        task,
		RootAgentID: root,
		AutoSpawn:   autoSpawn,
		Metadata:    meta,
	}, snap, nil
}
