package tui

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/memory"
)

func TestFormatMemoryViewDoesNotInitializeLocalDB(t *testing.T) {
	home := t.TempDir()
	t.Setenv("HOME", home)

	snap, err := memory.LoadSnapshotReadOnly()
	if err != nil {
		t.Fatalf("LoadSnapshotReadOnly() error = %v", err)
	}
	view := FormatMemoryView(snap)
	if strings.Contains(view, "Local SQLite memory DB") {
		t.Fatalf("view should omit absent DB status: %q", view)
	}
	if _, err := os.Stat(filepath.Join(home, ".arkelythex")); !os.IsNotExist(err) {
		t.Fatalf("memory view initialized runtime files, stat err=%v", err)
	}
}
