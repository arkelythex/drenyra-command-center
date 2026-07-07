package config

import (
	"errors"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

// Config is the Drenyra CLI user/project configuration.
type Config struct {
	Version     int                         `yaml:"version"`
	Harness     HarnessConfig               `yaml:"harness"`
	Memory      MemoryConfig                `yaml:"memory"`
	Fiscal      FiscalDefaults              `yaml:"fiscal"`
	Providers   ProvidersConfig             `yaml:"providers"`
	Agents      map[string]AgentModelConfig `yaml:"agents"`
	Routing     RoutingConfig               `yaml:"routing"`
	Permissions PermissionsConfig           `yaml:"permissions"`
}

// MemoryConfig mirrors Hermes ~/.hermes/config.yaml → memory:
type MemoryConfig struct {
	MemoryEnabled      bool   `yaml:"memory_enabled"`
	UserProfileEnabled bool   `yaml:"user_profile_enabled"`
	MemoryCharLimit    int    `yaml:"memory_char_limit"`
	UserCharLimit      int    `yaml:"user_char_limit"`
	Provider           string `yaml:"provider"` // builtin | engram
}

type HarnessConfig struct {
	API string `yaml:"api"`
}

type FiscalDefaults struct {
	OrganizationID string `yaml:"organization_id"`
	CompanyID      string `yaml:"company_id"`
	CompanyRUC     string `yaml:"company_ruc"`
	Period         string `yaml:"period"`
	UserID         string `yaml:"user_id"`
}

type ProvidersConfig struct {
	Default string `yaml:"default"`
}

type AgentModelConfig struct {
	Model           string `yaml:"model"`
	ReasoningEffort string `yaml:"reasoning_effort,omitempty"`
	Provider        string `yaml:"provider,omitempty"`
}

type RoutingConfig struct {
	Fallback []string `yaml:"fallback"`
}

type PermissionsConfig struct {
	DenyWithoutApproval []string `yaml:"deny_without_approval"`
}

// Default returns a new config with Drenyra CLI defaults.
func Default() *Config {
	return &Config{
		Version: 1,
		Harness: HarnessConfig{
			API: "http://localhost:3000/api/fiscal-command-center/harness",
		},
		Memory: MemoryConfig{
			MemoryEnabled:      true,
			UserProfileEnabled: true,
			MemoryCharLimit:    2200,
			UserCharLimit:      1375,
			Provider:           "builtin",
		},
		Fiscal: FiscalDefaults{
			OrganizationID: "org-dev",
			CompanyID:      "company-dev",
			CompanyRUC:     "20601234565",
			Period:         "2024-01",
			UserID:         "user-dev",
		},
		Providers: ProvidersConfig{Default: "openai-codex"},
		Agents: map[string]AgentModelConfig{
			"fiscal-command-orchestrator": {Model: "openai-codex/gpt-5.5", ReasoningEffort: "medium"},
			"fiscal-sunat-agent":          {Model: "openai-codex/gpt-5.5", ReasoningEffort: "high"},
			"fiscal-sunat-payload-agent":  {Model: "opencode-go/deepseek-v4-flash"},
			"fiscal-ledger-agent":         {Model: "openai-codex/gpt-5.5"},
			"fiscal-reconcile-agent":      {Model: "openai-codex/gpt-5.5"},
			"ai-swarm-orchestrator":       {Model: "cursor/composer-2.5"},
			"swarm-codegen-agent":         {Model: "cursor/composer-2.5"},
			"swarm-test-agent":            {Model: "opencode-go/deepseek-v4-flash"},
			"swarm-review-agent":          {Model: "openai-codex/gpt-5.5", ReasoningEffort: "high"},
			"drenyra-hr-orchestrator":     {Model: "openai-codex/gpt-5.5"},
			"hr-payroll-agent":            {Model: "openai-codex/gpt-5.5"},
		},
		Routing: RoutingConfig{
			Fallback: []string{
				"openai-codex/gpt-5.5",
				"opencode-go/deepseek-v4-flash",
			},
		},
		Permissions: PermissionsConfig{
			DenyWithoutApproval: []string{
				"sunat_submit",
				"ledger_post",
				"filing",
			},
		},
	}
}

// Load merges global (~/.drenyra/config.yaml) and optional project (.drenyra/config.yaml).
func Load() (*Config, error) {
	cfg := Default()

	globalPath, err := GlobalPath()
	if err != nil {
		return nil, err
	}
	if err := mergeFile(cfg, globalPath); err != nil && !errors.Is(err, os.ErrNotExist) {
		return nil, err
	}

	if cwd, err := os.Getwd(); err == nil {
		projectPath := filepath.Join(cwd, ".drenyra", "config.yaml")
		if err := mergeFile(cfg, projectPath); err != nil && !errors.Is(err, os.ErrNotExist) {
			return nil, err
		}
	}

	applyEnv(cfg)
	return cfg, nil
}

func mergeFile(cfg *Config, path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	return yaml.Unmarshal(data, cfg)
}

func applyEnv(cfg *Config) {
	if v := os.Getenv("DRENYRA_API_URL"); v != "" {
		cfg.Harness.API = v
	}
	if v := os.Getenv("DRENYRA_ORGANIZATION_ID"); v != "" {
		cfg.Fiscal.OrganizationID = v
	}
	if v := os.Getenv("DRENYRA_COMPANY_ID"); v != "" {
		cfg.Fiscal.CompanyID = v
	}
	if v := os.Getenv("DRENYRA_COMPANY_RUC"); v != "" {
		cfg.Fiscal.CompanyRUC = v
	}
	if v := os.Getenv("DRENYRA_FISCAL_PERIOD"); v != "" {
		cfg.Fiscal.Period = v
	}
	if v := os.Getenv("DRENYRA_USER_ID"); v != "" {
		cfg.Fiscal.UserID = v
	}
}

// GlobalPath returns ~/.drenyra/config.yaml
func GlobalPath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".drenyra", "config.yaml"), nil
}

// WriteGlobal writes default config to ~/.drenyra/config.yaml
func WriteGlobal(cfg *Config) error {
	path, err := GlobalPath()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	data, err := yaml.Marshal(cfg)
	if err != nil {
		return err
	}
	header := []byte("# Drenyra CLI — terminal companion config\n# Docs: docs/05-development/drenyra-cli.md\n\n")
	return os.WriteFile(path, append(header, data...), 0o600)
}
