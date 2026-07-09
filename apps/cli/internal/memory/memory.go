// Package memory implements Hermes Agent persistent memory for Drenyra CLI.
//
// Reference: https://github.com/NousResearch/hermes-agent (tools/memory_tool.py)
//
// - ~/.drenyra/memories/MEMORY.md + USER.md
// - § entry delimiter, add/replace/remove, char limits from config
// - Frozen snapshot per harness run (like Hermes session-start injection)
// - Engram (Gentle AI) is the IDE external provider; config memory.provider: engram
package memory

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/config"
)

// Limits — Hermes defaults when config omits overrides.
const (
	MaxMemoryChars = 2200
	MaxUserChars   = 1375
)

// Snapshot is the frozen memory state for one harness invocation.
type Snapshot struct {
	Memory        string
	User          string
	MemoryBlocks  string // Hermes system-prompt block (MEMORY)
	UserBlocks    string // Hermes system-prompt block (USER)
	MemoryPath    string
	UserPath      string
	MemoryUsed    int
	UserUsed      int
	MemoryLimit   int
	UserLimit     int
	MemoryEntries int
	UserEntries   int
}

func (s Snapshot) MemoryPct() float64 { return pct(s.MemoryUsed, s.MemoryLimit) }
func (s Snapshot) UserPct() float64   { return pct(s.UserUsed, s.UserLimit) }

// Dir returns ~/.drenyra/memories
func Dir() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".drenyra", "memories"), nil
}

// Paths returns MEMORY.md and USER.md paths.
func Paths() (memoryPath, userPath string, err error) {
	dir, err := Dir()
	if err != nil {
		return "", "", err
	}
	return filepath.Join(dir, "MEMORY.md"), filepath.Join(dir, "USER.md"), nil
}

// EnsureDefaults creates memory dir and Hermes-style seed entries if missing.
func EnsureDefaults() error {
	dir, err := Dir()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}
	memPath, userPath, err := Paths()
	if err != nil {
		return err
	}
	if err := writeIfMissing(memPath, defaultMemoryEntries); err != nil {
		return err
	}
	return writeIfMissing(userPath, defaultUserEntries)
}

func writeIfMissing(path, content string) error {
	if _, err := os.Stat(path); err == nil {
		return nil
	} else if !os.IsNotExist(err) {
		return err
	}
	return os.WriteFile(path, []byte(content), 0o600)
}

// Load uses global config for limits (Hermes: ~/.hermes/config.yaml memory:).
func Load() (Snapshot, error) {
	return loadWithMode(false)
}

// LoadReadOnly reads memory without creating default files or directories.
func LoadReadOnly() (Snapshot, error) {
	return loadWithMode(true)
}

func loadWithMode(readOnly bool) (Snapshot, error) {
	cfg, err := config.Load()
	store := NewStore(DefaultSettings())
	if err == nil {
		store = NewStore(SettingsFromConfig(cfg))
	}
	if readOnly {
		return store.LoadSnapshotReadOnly()
	}
	return store.LoadSnapshot()
}

// Metadata returns harness metadata fields for ExecuteRequest.
func Metadata(s Snapshot) map[string]any {
	out := map[string]any{
		"memorySnapshot": true,
		"memoryPct":      s.MemoryPct(),
		"userPct":        s.UserPct(),
		"memoryFormat":   "hermes-v1",
	}
	if s.MemoryBlocks != "" {
		out["persistentMemory"] = s.MemoryBlocks
	} else if s.Memory != "" {
		out["persistentMemory"] = s.Memory
	}
	if s.UserBlocks != "" {
		out["userContext"] = s.UserBlocks
	} else if s.User != "" {
		out["userContext"] = s.User
	}
	return out
}

// StatusLine is a compact status-bar fragment.
func StatusLine(s Snapshot) string {
	if s.MemoryUsed == 0 && s.UserUsed == 0 {
		return "mem —"
	}
	return fmt.Sprintf("mem %.0f%% (%d) · user %.0f%% (%d)",
		s.MemoryPct(), s.MemoryEntries, s.UserPct(), s.UserEntries)
}

// DefaultStore returns a store with config-backed settings.
func DefaultStore() (*Store, error) {
	cfg, err := config.Load()
	if err != nil {
		return NewStore(DefaultSettings()), nil
	}
	return NewStore(SettingsFromConfig(cfg)), nil
}
