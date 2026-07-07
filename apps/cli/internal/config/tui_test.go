package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestDefaultTUI(t *testing.T) {
	cfg := DefaultTUI()
	if cfg.Theme == "" {
		t.Fatal("default theme must be set")
	}
	if cfg.DefaultMode != "build" {
		t.Fatalf("DefaultMode = %q, want build", cfg.DefaultMode)
	}
	if cfg.DiffStyle != "auto" {
		t.Fatalf("DiffStyle = %q, want auto", cfg.DiffStyle)
	}
	if !cfg.SidebarVisible {
		t.Fatal("sidebar should default to visible")
	}
}

func TestMergeTUIFile(t *testing.T) {
	path := filepath.Join(t.TempDir(), "tui.json")
	if err := os.WriteFile(path, []byte(`{"theme":"light","default_mode":"plan","diff_style":"stacked","sidebar_visible":false,"reduced_motion":true}`), 0o600); err != nil {
		t.Fatalf("write fixture: %v", err)
	}

	cfg := DefaultTUI()
	if err := mergeTUIFile(&cfg, path); err != nil {
		t.Fatalf("mergeTUIFile() error = %v", err)
	}

	if cfg.Theme != "light" || cfg.DefaultMode != "plan" || cfg.DiffStyle != "stacked" || cfg.SidebarVisible || !cfg.ReducedMotion {
		t.Fatalf("merged cfg = %#v", cfg)
	}
}
