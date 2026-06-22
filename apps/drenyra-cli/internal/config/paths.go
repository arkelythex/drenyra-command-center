package config

import (
	"os"
	"path/filepath"
)

// ConfigPaths holds resolved config file locations.
type ConfigPaths struct {
	Global  string
	Project string
}

// Paths returns global and optional project config paths.
func Paths() (ConfigPaths, error) {
	global, err := GlobalPath()
	if err != nil {
		return ConfigPaths{}, err
	}
	paths := ConfigPaths{Global: global}
	if cwd, err := os.Getwd(); err == nil {
		paths.Project = filepath.Join(cwd, ".arkelythex", "config.yaml")
	}
	return paths, nil
}
