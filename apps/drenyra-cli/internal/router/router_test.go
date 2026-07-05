package router

import (
	"testing"

	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/config"
)

func TestResolve_knownAgent(t *testing.T) {
	cfg := config.Default()
	r, err := Resolve(cfg, "fiscal-sunat-agent")
	if err != nil {
		t.Fatal(err)
	}
	if r.Model != "openai-codex/gpt-5.5" || r.Provider != "openai-codex" {
		t.Fatalf("unexpected resolve: %+v", r)
	}
}

func TestAutonomy_levels(t *testing.T) {
	spawn, _ := Autonomy("low")
	if spawn {
		t.Fatal("low should not auto spawn")
	}
	spawn, _ = Autonomy("high")
	if !spawn {
		t.Fatal("high should auto spawn")
	}
}
