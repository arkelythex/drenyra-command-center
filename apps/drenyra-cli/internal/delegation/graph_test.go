package delegation

import "testing"

func TestResolveRootAgent_fiscal(t *testing.T) {
	if got := ResolveRootAgent("prepare SIRE libro for SUNAT"); got != "fiscal-command-orchestrator" {
		t.Fatalf("got %q want fiscal-command-orchestrator", got)
	}
}

func TestResolveRootAgent_hr(t *testing.T) {
	if got := ResolveRootAgent("run payroll PLAME"); got != "drenyra-hr-orchestrator" {
		t.Fatalf("got %q want drenyra-hr-orchestrator", got)
	}
}

func TestResolveRootAgent_swarm(t *testing.T) {
	if got := ResolveRootAgent("refactor module and add tests"); got != "ai-swarm-orchestrator" {
		t.Fatalf("got %q want ai-swarm-orchestrator", got)
	}
}

func TestResolveRootAgent_latin(t *testing.T) {
	if got := ResolveRootAgent("investigate evidence and validate governance"); got != "latin-moderno-orchestrator" {
		t.Fatalf("got %q want latin-moderno-orchestrator", got)
	}
}

func TestResolveRootAgent_consolidate(t *testing.T) {
	if got := ResolveRootAgent("consolidate archive insights"); got != "latin-moderno-orchestrator" {
		t.Fatalf("got %q want latin-moderno-orchestrator", got)
	}
}

func TestAgents_latinModernoLeaves(t *testing.T) {
	for _, id := range []string{"cerno-agent", "custos-agent", "necto-agent", "regula-agent", "lumen-agent", "fusio-agent", "scripta-agent", "capsa-agent"} {
		a, ok := Agents[id]
		if !ok {
			t.Fatalf("missing agent %q", id)
		}
		if !a.Leaf {
			t.Fatalf("expected %q to be a leaf", id)
		}
		if a.Parent != "latin-moderno-orchestrator" {
			t.Fatalf("expected %q parent to be latin-moderno-orchestrator, got %q", id, a.Parent)
		}
	}
}

func TestAgents_hasPayloadLeaf(t *testing.T) {
	a, ok := Agents["fiscal-sunat-payload-agent"]
	if !ok || !a.Leaf {
		t.Fatal("expected fiscal-sunat-payload-agent leaf")
	}
}
