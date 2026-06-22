package memory

import "github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/config"

// Settings mirrors ~/.hermes/config.yaml → memory: (Hermes Agent).
type Settings struct {
	MemoryEnabled      bool
	UserProfileEnabled bool
	MemoryCharLimit    int
	UserCharLimit      int
	Provider           string // "builtin" | "engram" (external, additive)
}

// DefaultSettings returns Hermes-documented defaults.
func DefaultSettings() Settings {
	return Settings{
		MemoryEnabled:      true,
		UserProfileEnabled: true,
		MemoryCharLimit:    MaxMemoryChars,
		UserCharLimit:      MaxUserChars,
		Provider:           "builtin",
	}
}

// SettingsFromConfig maps config.Memory into runtime limits.
func SettingsFromConfig(c *config.Config) Settings {
	s := DefaultSettings()
	if c == nil {
		return s
	}
	m := c.Memory
	if m.MemoryCharLimit > 0 {
		s.MemoryCharLimit = m.MemoryCharLimit
	}
	if m.UserCharLimit > 0 {
		s.UserCharLimit = m.UserCharLimit
	}
	s.MemoryEnabled = m.MemoryEnabled
	s.UserProfileEnabled = m.UserProfileEnabled
	if m.Provider != "" {
		s.Provider = m.Provider
	}
	return s
}
