package config

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"

	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/modes"
)

// TUIConfig controls Drenyra CLI full-screen UI preferences.
type TUIConfig struct {
	Theme          string `json:"theme"`
	DefaultMode    string `json:"default_mode"`
	DiffStyle      string `json:"diff_style"`
	SidebarVisible bool   `json:"sidebar_visible"`
	ReducedMotion  bool   `json:"reduced_motion"`
}

// DefaultTUI returns safe, accessible TUI defaults.
func DefaultTUI() TUIConfig {
	return TUIConfig{
		Theme:          "drenyra-dark",
		DefaultMode:    "build",
		DiffStyle:      "auto",
		SidebarVisible: true,
		ReducedMotion:  false,
	}
}

// TUIPaths returns global and optional project TUI config paths.
func TUIPaths() (ConfigPaths, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return ConfigPaths{}, err
	}
	paths := ConfigPaths{Global: filepath.Join(home, ".drenyra", "tui.json")}
	if cwd, err := os.Getwd(); err == nil {
		paths.Project = filepath.Join(cwd, ".drenyra", "tui.json")
	}
	return paths, nil
}

// LoadTUI merges ~/.drenyra/tui.json and optional project .drenyra/tui.json.
func LoadTUI() (TUIConfig, error) {
	cfg := DefaultTUI()
	paths, err := TUIPaths()
	if err != nil {
		return cfg, err
	}
	if err := mergeTUIFile(&cfg, paths.Global); err != nil && !errors.Is(err, os.ErrNotExist) {
		return cfg, err
	}
	if paths.Project != "" {
		if err := mergeTUIFile(&cfg, paths.Project); err != nil && !errors.Is(err, os.ErrNotExist) {
			return cfg, err
		}
	}
	cfg.DefaultMode = string(modes.Normalize(cfg.DefaultMode))
	return cfg, nil
}

func mergeTUIFile(cfg *TUIConfig, path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, cfg)
}
