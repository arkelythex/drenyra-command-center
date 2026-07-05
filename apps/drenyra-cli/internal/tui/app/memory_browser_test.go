package app

import (
	"strings"
	"testing"

	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/memory"
)

func TestClampMemoryCursor(t *testing.T) {
	results := []memory.SearchResult{{Title: "one"}, {Title: "two"}}
	tests := []struct {
		name   string
		cursor int
		want   int
	}{
		{name: "empty", cursor: 3, want: 0},
		{name: "negative", cursor: -1, want: 0},
		{name: "inside", cursor: 1, want: 1},
		{name: "past end", cursor: 9, want: 1},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := clampMemoryCursor(tt.cursor, results)
			if tt.name == "empty" {
				got = clampMemoryCursor(tt.cursor, nil)
			}
			if got != tt.want {
				t.Fatalf("clampMemoryCursor() = %d, want %d", got, tt.want)
			}
		})
	}
}

func TestMemoryStatusLine(t *testing.T) {
	got := memoryStatusLine(memory.DBStatus{Path: "/tmp/drenyra.db", Sessions: 1, Runs: 2, Memories: 3, Decisions: 4, Bugs: 5})
	for _, want := range []string{"/tmp/drenyra.db", "sessions:1", "runs:2", "memories:3", "decisions:4", "bugs:5"} {
		if !strings.Contains(got, want) {
			t.Fatalf("memoryStatusLine() = %q, want %q", got, want)
		}
	}
}

func TestMemorySnapshotLine(t *testing.T) {
	got := memorySnapshotLine(memory.Snapshot{MemoryUsed: 10, MemoryLimit: 100, UserUsed: 5, UserLimit: 20})
	for _, want := range []string{"MEMORY 10/100", "USER 5/20"} {
		if !strings.Contains(got, want) {
			t.Fatalf("memorySnapshotLine() = %q, want %q", got, want)
		}
	}
}
